/**
 * Type definitions for Antigravity Quota Viewer
 */

// ============================================
// Configuration Types
// ============================================

export interface ExtensionConfig {
  enabled: boolean;
  pollingInterval: number;
  pinnedModels: string[];
  alertThreshold: number;
}

// ============================================
// Process Detection Types
// ============================================

export interface ProcessInfo {
  pid: number;
  extensionPort: number;
  connectPort: number;
  csrfToken: string;
}

export interface PlatformStrategy {
  getProcessListCommand(processName: string): string;
  parseProcessInfo(stdout: string): { pid: number; extensionPort: number; csrfToken: string } | null;
  getPortListCommand(pid: number): string;
  parseListeningPorts(stdout: string): number[];
}

// ============================================
// Quota Data Types
// ============================================

export interface ModelQuota {
  label: string;
  modelId: string;
  remainingFraction: number;
  remainingPercent: number;
  isExhausted: boolean;
  resetTime: Date;
  timeUntilReset: number;
  timeUntilResetFormatted: string;
}

export interface PromptCredits {
  available: number;
  monthly: number;
  usedPercentage: number;
  remainingPercentage: number;
}

export interface QuotaSnapshot {
  timestamp: Date;
  models: ModelQuota[];
  promptCredits?: PromptCredits;
}

// ============================================
// Insights Types
// ============================================

export interface UsageInsight {
  burnRate: number;
  burnRateLabel: string;
  predictedExhaustion?: Date;
  predictedExhaustionLabel: string;
  trendDirection: 'stable' | 'decreasing' | 'warning' | 'critical';
  sessionUsage: number;
  isActive: boolean;
}

export interface ModelWithInsights extends ModelQuota {
  insights: UsageInsight;
}

export interface SnapshotWithInsights extends QuotaSnapshot {
  modelsWithInsights: ModelWithInsights[];
  overallHealth: number;
  healthLabel: string;
  sessionStartTime: Date;
  totalSessionUsage: number;
}

// ============================================
// API Response Types
// ============================================

export interface ServerUserStatusResponse {
  userStatus: {
    planStatus?: {
      planInfo?: {
        monthlyPromptCredits: string | number;
      };
      availablePromptCredits?: string | number;
    };
    cascadeModelConfigData?: {
      clientModelConfigs?: RawModelConfig[];
    };
  };
}

export interface RawModelConfig {
  label: string;
  modelOrAlias?: {
    model?: string;
  };
  quotaInfo?: {
    remainingFraction?: number;
    resetTime?: string;
  };
}

// ============================================
// History Tracking Types
// ============================================

export interface HistoryEntry {
  timestamp: Date;
  models: Map<string, number>;
}
