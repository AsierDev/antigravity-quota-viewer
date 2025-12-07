/**
 * Insights Service
 * Provides analytics: burn rate, exhaustion predictions, active model detection
 */

import {
  QuotaSnapshot,
  ModelQuota,
  UsageInsight,
  ModelWithInsights,
  SnapshotWithInsights,
  HistoryEntry
} from '../types';

const MAX_HISTORY = 20;

export class InsightsService {
  private history: HistoryEntry[] = [];
  private sessionStartTime: Date;
  private sessionStartQuotas: Map<string, number> = new Map();
  private lastActiveModelId: string | undefined;

  constructor() {
    this.sessionStartTime = new Date();
  }

  /**
   * Analyze a snapshot and enrich it with insights
   */
  analyze(snapshot: QuotaSnapshot): SnapshotWithInsights {
    // Record history
    this.recordSnapshot(snapshot);

    // Initialize session start if needed
    this.initSessionStart(snapshot);

    // Analyze each model
    const modelsWithInsights = snapshot.models.map(model =>
      this.analyzeModel(model, snapshot)
    );

    // Sort: active first, then by lowest remaining %
    modelsWithInsights.sort((a, b) => {
      if (a.insights.isActive && !b.insights.isActive) return -1;
      if (!a.insights.isActive && b.insights.isActive) return 1;
      return a.remainingPercent - b.remainingPercent;
    });

    // Calculate overall health
    const { overallHealth, healthLabel } = this.calculateOverallHealth(modelsWithInsights);

    // Calculate total session usage
    const totalSessionUsage = modelsWithInsights.length > 0
      ? modelsWithInsights.reduce((sum, m) => sum + m.insights.sessionUsage, 0) / modelsWithInsights.length
      : 0;

    return {
      ...snapshot,
      modelsWithInsights,
      overallHealth,
      healthLabel,
      sessionStartTime: this.sessionStartTime,
      totalSessionUsage: Math.round(totalSessionUsage)
    };
  }

  /**
   * Record snapshot in history
   */
  private recordSnapshot(snapshot: QuotaSnapshot): void {
    const entry: HistoryEntry = {
      timestamp: snapshot.timestamp,
      models: new Map()
    };

    for (const model of snapshot.models) {
      entry.models.set(model.modelId, model.remainingPercent);
    }

    this.history.push(entry);

    // Keep only last N entries
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
  }

  /**
   * Initialize session start quotas
   */
  private initSessionStart(snapshot: QuotaSnapshot): void {
    for (const model of snapshot.models) {
      if (!this.sessionStartQuotas.has(model.modelId)) {
        this.sessionStartQuotas.set(model.modelId, model.remainingPercent);
      }
    }
  }

  /**
   * Analyze a single model
   */
  private analyzeModel(model: ModelQuota, snapshot: QuotaSnapshot): ModelWithInsights {
    const burnRate = this.calculateBurnRate(model.modelId);
    const sessionUsage = this.calculateSessionUsage(model.modelId, model.remainingPercent);
    const isActive = this.detectActiveModel(model, snapshot);

    let predictedExhaustion: Date | undefined;
    let predictedExhaustionLabel: string;

    if (burnRate > 0 && model.remainingPercent > 0) {
      const hoursUntilEmpty = model.remainingPercent / burnRate;
      predictedExhaustion = new Date(Date.now() + hoursUntilEmpty * 60 * 60 * 1000);
      predictedExhaustionLabel = this.formatPrediction(hoursUntilEmpty);
    } else if (model.isExhausted) {
      predictedExhaustionLabel = 'Exhausted';
    } else {
      predictedExhaustionLabel = 'Safe';
    }

    const trendDirection = this.getTrendDirection(model.remainingPercent, burnRate);
    const burnRateLabel = this.getBurnRateLabel(burnRate);

    if (isActive) {
      this.lastActiveModelId = model.modelId;
    }

    return {
      ...model,
      insights: {
        burnRate,
        burnRateLabel,
        predictedExhaustion,
        predictedExhaustionLabel,
        trendDirection,
        sessionUsage,
        isActive
      }
    };
  }

  /**
   * Calculate burn rate in %/hour
   */
  private calculateBurnRate(modelId: string): number {
    if (this.history.length < 2) return 0;

    const oldest = this.history[0];
    const newest = this.history[this.history.length - 1];

    const oldValue = oldest.models.get(modelId);
    const newValue = newest.models.get(modelId);

    if (oldValue === undefined || newValue === undefined) return 0;

    const deltaPercent = oldValue - newValue;
    const deltaHours = (newest.timestamp.getTime() - oldest.timestamp.getTime()) / (1000 * 60 * 60);

    if (deltaHours <= 0) return 0;

    return Math.max(0, deltaPercent / deltaHours);
  }

  /**
   * Calculate session usage
   */
  private calculateSessionUsage(modelId: string, currentPercent: number): number {
    const startPercent = this.sessionStartQuotas.get(modelId);
    if (startPercent === undefined) return 0;
    return Math.max(0, startPercent - currentPercent);
  }

  /**
   * Detect if this is the active model
   */
  private detectActiveModel(model: ModelQuota, snapshot: QuotaSnapshot): boolean {
    // Strategy 1: Significant Burn Rate (consumption per hour)
    // Only consider active if consumption is clearly visible (> 1% per hour)
    const burnRate = this.calculateBurnRate(model.modelId);
    
    if (burnRate > 1.0) {
      // Check if this model has the highest burn rate of all
      const allBurnRates = snapshot.models.map(m => this.calculateBurnRate(m.modelId));
      const maxBurnRate = Math.max(...allBurnRates);
      
      if (burnRate === maxBurnRate) {
        return true;
      }
    }

    // Strategy 2: Persistence (Last known active model)
    // Only stick to last active if we don't have a new clear winner
    // and the last active model is still in the list
    if (this.lastActiveModelId === model.modelId) {
      // But verify it hasn't been idle for too long (optional check could be added here)
      return true;
    }

    // Strategy 3: REMOVED (Lowest remaining fallback)
    // This caused false positives when multiple models had the same low percentage
    // It's better to show NO active model than the WRONG active model(s)

    return false;
  }

  /**
   * Get trend direction based on remaining % and burn rate
   */
  private getTrendDirection(remainingPercent: number, burnRate: number): 'stable' | 'decreasing' | 'warning' | 'critical' {
    if (remainingPercent <= 10 || burnRate > 20) return 'critical';
    if (remainingPercent <= 25 || burnRate > 10) return 'warning';
    if (burnRate > 2) return 'decreasing';
    return 'stable';
  }

  /**
   * Get human-readable burn rate label
   */
  private getBurnRateLabel(burnRate: number): string {
    if (burnRate <= 0.5) return 'Minimal';
    if (burnRate <= 2) return 'Slow';
    if (burnRate <= 5) return 'Moderate';
    if (burnRate <= 15) return 'Fast';
    return 'Very Fast';
  }

  /**
   * Format exhaustion prediction
   */
  private formatPrediction(hours: number): string {
    if (hours > 48) {
      const days = Math.floor(hours / 24);
      return `~${days}d`;
    }
    if (hours > 1) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
    }
    const mins = Math.round(hours * 60);
    return mins > 0 ? `~${mins}m` : '<1m';
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(models: ModelWithInsights[]): { overallHealth: number; healthLabel: string } {
    if (models.length === 0) {
      return { overallHealth: 100, healthLabel: 'Unknown' };
    }

    // Weighted average: active model counts more
    let totalWeight = 0;
    let weightedSum = 0;

    for (const model of models) {
      const weight = model.insights.isActive ? 3 : 1;
      totalWeight += weight;
      weightedSum += model.remainingPercent * weight;
    }

    const overallHealth = Math.round(weightedSum / totalWeight);

    let healthLabel: string;
    if (overallHealth >= 75) healthLabel = 'Excellent';
    else if (overallHealth >= 50) healthLabel = 'Good';
    else if (overallHealth >= 25) healthLabel = 'Low';
    else healthLabel = 'Critical';

    return { overallHealth, healthLabel };
  }

  /**
   * Get short model name for status bar
   */
  getShortName(label: string): string {
    if (label.includes('Claude')) {
      const match = label.match(/Claude\s+(\w+)\s*([\d.]+)?/);
      if (match) {
        return `Claude ${match[1][0]}${match[2] || ''}`;
      }
      return 'Claude';
    }
    if (label.includes('Gemini')) {
      const isHigh = label.includes('High');
      const isPro = label.includes('Pro');
      const isFlash = label.includes('Flash');
      let short = 'Gem';
      if (isPro) short = 'Pro';
      if (isFlash) short = 'Flash';
      if (isHigh) short += '↑';
      return short;
    }
    if (label.includes('GPT') || label.includes('O3')) {
      return 'GPT';
    }
    return label.split(' ')[0].substring(0, 6);
  }
}
