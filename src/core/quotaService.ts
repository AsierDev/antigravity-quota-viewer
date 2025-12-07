/**
 * Quota Service
 * Fetches quota data from Antigravity's language server API
 */

import * as https from 'https';
import {
  QuotaSnapshot,
  ModelQuota,
  PromptCredits,
  ServerUserStatusResponse,
  RawModelConfig
} from '../types';

export class QuotaService {
  private port = 0;
  private csrfToken = '';
  private lastSnapshot: QuotaSnapshot | null = null;

  /**
   * Set connection parameters
   */
  setConnection(port: number, csrfToken: string): void {
    this.port = port;
    this.csrfToken = csrfToken;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.port > 0 && this.csrfToken.length > 0;
  }

  /**
   * Get the last snapshot
   */
  getSnapshot(): QuotaSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * Fetch quota data from the API
   */
  async poll(): Promise<ModelQuota[]> {
    if (!this.isConfigured()) {
      throw new Error('QuotaService not configured');
    }

    const response = await this.request<ServerUserStatusResponse>(
      '/exa.language_server_pb.LanguageServerService/GetUserStatus',
      {
        metadata: {
          ideName: 'antigravity',
          extensionName: 'antigravity',
          locale: 'en'
        }
      }
    );

    this.lastSnapshot = this.parseResponse(response);
    return this.lastSnapshot.models;
  }

  /**
   * Make an HTTPS request to the API
   */
  private request<T>(path: string, body: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      
      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port: this.port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Connect-Protocol-Version': '1',
          'X-Codeium-Csrf-Token': this.csrfToken
        },
        rejectUnauthorized: false,
        timeout: 10000
      };

      const req = https.request(options, res => {
        let responseBody = '';
        res.on('data', chunk => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseBody) as T);
          } catch {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Parse API response into QuotaSnapshot
   */
  private parseResponse(data: ServerUserStatusResponse): QuotaSnapshot {
    const userStatus = data.userStatus;
    const planInfo = userStatus.planStatus?.planInfo;
    const availableCredits = userStatus.planStatus?.availablePromptCredits;

    // Parse prompt credits
    let promptCredits: PromptCredits | undefined;
    if (planInfo && availableCredits !== undefined) {
      const monthly = Number(planInfo.monthlyPromptCredits);
      const available = Number(availableCredits);
      
      if (monthly > 0) {
        promptCredits = {
          available,
          monthly,
          usedPercentage: ((monthly - available) / monthly) * 100,
          remainingPercentage: (available / monthly) * 100
        };
      }
    }

    // Parse model quotas
    const rawModels = userStatus.cascadeModelConfigData?.clientModelConfigs || [];
    const models: ModelQuota[] = rawModels
      .filter((m: RawModelConfig) => m.quotaInfo)
      .map((m: RawModelConfig) => {
        const resetTime = new Date(m.quotaInfo!.resetTime || Date.now());
        const now = new Date();
        const diff = resetTime.getTime() - now.getTime();
        const remainingFraction = m.quotaInfo!.remainingFraction ?? 1;

        return {
          label: m.label,
          modelId: m.modelOrAlias?.model || 'unknown',
          remainingFraction,
          remainingPercent: Math.round(remainingFraction * 100),
          isExhausted: remainingFraction === 0,
          resetTime,
          timeUntilReset: diff,
          timeUntilResetFormatted: this.formatTime(diff)
        };
      });

    return {
      timestamp: new Date(),
      models,
      promptCredits
    };
  }

  /**
   * Format milliseconds into human-readable time
   */
  private formatTime(ms: number): string {
    if (ms <= 0) return 'Ready';
    
    const mins = Math.ceil(ms / 60000);
    if (mins < 60) return `${mins}m`;
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours < 24) {
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}
