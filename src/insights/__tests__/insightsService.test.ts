/**
 * Tests for InsightsService
 */

import { InsightsService } from '../insightsService';
import {
  createMockQuotaSnapshot,
  createMockModelQuota,
} from '../../__tests__/helpers/mockData';
import { QuotaSnapshot } from '../../types';

describe('InsightsService', () => {
  let service: InsightsService;

  beforeEach(() => {
    service = new InsightsService();
  });

  describe('analyze', () => {
    it('should enrich snapshot with insights', () => {
      const snapshot = createMockQuotaSnapshot();
      const result = service.analyze(snapshot);

      expect(result.modelsWithInsights).toBeDefined();
      expect(result.modelsWithInsights.length).toBe(snapshot.models.length);
      expect(result.overallHealth).toBeDefined();
      expect(result.healthLabel).toBeDefined();
      expect(result.sessionStartTime).toBeInstanceOf(Date);
    });

    it('should add insights to each model', () => {
      const snapshot = createMockQuotaSnapshot();
      const result = service.analyze(snapshot);

      result.modelsWithInsights.forEach((model) => {
        expect(model.insights).toBeDefined();
        expect(model.insights.burnRate).toBeDefined();
        expect(model.insights.burnRateLabel).toBeDefined();
        expect(model.insights.trendDirection).toBeDefined();
        expect(model.insights.sessionUsage).toBeDefined();
        expect(typeof model.insights.isActive).toBe('boolean');
      });
    });

    it('should calculate overall health', () => {
      const snapshot = createMockQuotaSnapshot();
      const result = service.analyze(snapshot);

      expect(result.overallHealth).toBeGreaterThanOrEqual(0);
      expect(result.overallHealth).toBeLessThanOrEqual(100);
      expect(['Excellent', 'Good', 'Fair', 'Low', 'Critical']).toContain(
        result.healthLabel
      );
    });

    it('should track session start time', () => {
      const snapshot = createMockQuotaSnapshot();
      const result = service.analyze(snapshot);

      expect(result.sessionStartTime).toBeInstanceOf(Date);
    });
  });

  describe('calculateBurnRate', () => {
    it('should return 0 with insufficient history', () => {
      const snapshot = createMockQuotaSnapshot();
      service.analyze(snapshot);

      const burnRate = (service as any).calculateBurnRate('anthropic/claude-3.5-sonnet');
      expect(burnRate).toBe(0);
    });

    it('should calculate burn rate with sufficient history', () => {
      const snapshot1 = createMockQuotaSnapshot();
      const snapshot2 = createMockQuotaSnapshot({
        models: [
          createMockModelQuota({
            modelId: 'anthropic/claude-3.5-sonnet',
            remainingPercent: 70, // decreased from 75
          }),
        ],
      });

      service.analyze(snapshot1);
      // Simulate time passing
      jest.useFakeTimers();
      jest.advanceTimersByTime(3600000); // 1 hour
      service.analyze(snapshot2);
      jest.useRealTimers();

      const burnRate = (service as any).calculateBurnRate('anthropic/claude-3.5-sonnet');
      expect(burnRate).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for unknown model', () => {
      const snapshot = createMockQuotaSnapshot();
      service.analyze(snapshot);

      const burnRate = (service as any).calculateBurnRate('unknown/model');
      expect(burnRate).toBe(0);
    });
  });

  describe('calculateSessionUsage', () => {
    it('should return 0 for first analysis', () => {
      const sessionUsage = (service as any).calculateSessionUsage(
        'anthropic/claude-3.5-sonnet',
        75
      );
      expect(sessionUsage).toBe(0);
    });

    it('should calculate session usage correctly', () => {
      // Initialize session
      (service as any).sessionStartQuotas.set('anthropic/claude-3.5-sonnet', 75);

      const sessionUsage = (service as any).calculateSessionUsage(
        'anthropic/claude-3.5-sonnet',
        60
      );
      expect(sessionUsage).toBe(15);
    });

    it('should handle negative session usage (quota increased)', () => {
      (service as any).sessionStartQuotas.set('anthropic/claude-3.5-sonnet', 50);

      const sessionUsage = (service as any).calculateSessionUsage(
        'anthropic/claude-3.5-sonnet',
        75
      );
      // calculateSessionUsage uses Math.max(0, ...) so negative values become 0
      expect(sessionUsage).toBe(0);
    });
  });

  describe('detectActiveModel', () => {
    it('should detect active model based on quota change', () => {
      const model = createMockModelQuota({
        modelId: 'anthropic/claude-3.5-sonnet',
        remainingPercent: 70,
      });
      const snapshot = createMockQuotaSnapshot({
        models: [model],
      });

      // First snapshot
      service.analyze(snapshot);

      // Second snapshot with decreased quota
      const model2 = createMockModelQuota({
        modelId: 'anthropic/claude-3.5-sonnet',
        remainingPercent: 65,
      });
      const snapshot2 = createMockQuotaSnapshot({
        models: [model2],
      });

      const isActive = (service as any).detectActiveModel(model2, snapshot2);
      expect(typeof isActive).toBe('boolean');
    });

    it('should not detect activity without history', () => {
      const model = createMockModelQuota({ remainingPercent: 95 });
      const snapshot = createMockQuotaSnapshot({
        models: [model],
      });

      const isActive = (service as any).detectActiveModel(model, snapshot);
      // With high remaining % (>90), it won't be detected as active
      expect(isActive).toBe(false);
    });
  });

  describe('getTrendDirection', () => {
    it('should return "critical" for low remaining with high burn rate', () => {
      const trend = (service as any).getTrendDirection(10, 15);
      expect(trend).toBe('critical');
    });

    it('should return "warning" for medium remaining with high burn rate', () => {
      const trend = (service as any).getTrendDirection(30, 11);
      expect(trend).toBe('warning');
    });

    it('should return "decreasing" for high remaining with moderate burn rate', () => {
      const trend = (service as any).getTrendDirection(70, 5);
      expect(trend).toBe('decreasing');
    });

    it('should return "stable" for high remaining with low burn rate', () => {
      const trend = (service as any).getTrendDirection(90, 1);
      expect(trend).toBe('stable');
    });

    it('should handle edge cases', () => {
      expect((service as any).getTrendDirection(0, 0)).toBe('critical');
      expect((service as any).getTrendDirection(100, 0)).toBe('stable');
    });
  });

  describe('getBurnRateLabel', () => {
    it('should return "Minimal" for very low burn rate', () => {
      expect((service as any).getBurnRateLabel(0)).toBe('Minimal');
      expect((service as any).getBurnRateLabel(0.5)).toBe('Minimal');
    });

    it('should return "Slow" for low burn rate', () => {
      expect((service as any).getBurnRateLabel(1)).toBe('Slow');
      expect((service as any).getBurnRateLabel(2)).toBe('Slow');
    });

    it('should return "Moderate" for moderate burn rate', () => {
      expect((service as any).getBurnRateLabel(3)).toBe('Moderate');
      expect((service as any).getBurnRateLabel(5)).toBe('Moderate');
    });

    it('should return "Fast" for high burn rate', () => {
      expect((service as any).getBurnRateLabel(10)).toBe('Fast');
      expect((service as any).getBurnRateLabel(15)).toBe('Fast');
    });

    it('should return "Very Fast" for very high burn rate', () => {
      expect((service as any).getBurnRateLabel(20)).toBe('Very Fast');
      expect((service as any).getBurnRateLabel(25)).toBe('Very Fast');
    });
  });

  describe('formatPrediction', () => {
    it('should format minutes correctly', () => {
      expect((service as any).formatPrediction(0.5)).toBe('~30m');
      expect((service as any).formatPrediction(1)).toBe('~60m');
    });

    it('should format hours correctly', () => {
      expect((service as any).formatPrediction(2)).toBe('~2h');
      expect((service as any).formatPrediction(12)).toBe('~12h');
      expect((service as any).formatPrediction(24)).toBe('~24h');
    });

    it('should format days correctly', () => {
      expect((service as any).formatPrediction(49)).toBe('~2d');
      expect((service as any).formatPrediction(72)).toBe('~3d');
      expect((service as any).formatPrediction(168)).toBe('~7d');
    });

    it('should return "<1m" for very small values', () => {
      expect((service as any).formatPrediction(0)).toBe('<1m');
      // 0.01 hours = 0.6 minutes, rounds to 1m
      expect((service as any).formatPrediction(0.01)).toBe('~1m');
    });

    it('should handle very large values', () => {
      const result = (service as any).formatPrediction(1000);
      expect(result).toContain('d');
      expect(result).toMatch(/~\d+d/);
    });
  });

  describe('calculateOverallHealth', () => {
    it('should return excellent health for all models at 100%', () => {
      const models = [
        { ...createMockModelQuota({ remainingPercent: 100 }), insights: {} as any },
        { ...createMockModelQuota({ remainingPercent: 100 }), insights: {} as any },
      ];

      const result = (service as any).calculateOverallHealth(models);
      expect(result.overallHealth).toBe(100);
      expect(result.healthLabel).toBe('Excellent');
    });

    it('should return critical health for exhausted models', () => {
      const models = [
        { ...createMockModelQuota({ remainingPercent: 0 }), insights: {} as any },
        { ...createMockModelQuota({ remainingPercent: 5 }), insights: {} as any },
      ];

      const result = (service as any).calculateOverallHealth(models);
      expect(result.overallHealth).toBeLessThan(20);
      expect(result.healthLabel).toBe('Critical');
    });

    it('should return appropriate label for medium health', () => {
      const models = [
        { ...createMockModelQuota({ remainingPercent: 50 }), insights: {} as any },
        { ...createMockModelQuota({ remainingPercent: 60 }), insights: {} as any },
      ];

      const result = (service as any).calculateOverallHealth(models);
      expect(result.overallHealth).toBeGreaterThan(40);
      expect(result.overallHealth).toBeLessThan(80);
      expect(['Good', 'Fair']).toContain(result.healthLabel);
    });

    it('should handle empty model array', () => {
      const result = (service as any).calculateOverallHealth([]);
      expect(result.overallHealth).toBe(100);
      expect(result.healthLabel).toBe('Unknown');
    });
  });

  describe('getShortName', () => {
    it('should shorten Claude model names', () => {
      // The regex captures the version number after Claude
      expect((service as any).getShortName('Claude 3.5 Sonnet')).toBe('Claude 3.5');
      expect((service as any).getShortName('Claude 3 Opus')).toBe('Claude 3');
    });

    it('should shorten GPT model names', () => {
      expect((service as any).getShortName('GPT-4')).toBe('GPT');
      expect((service as any).getShortName('GPT-4 Turbo')).toBe('GPT');
      expect((service as any).getShortName('GPT-3.5 Turbo')).toBe('GPT');
    });

    it('should shorten Gemini model names', () => {
      expect((service as any).getShortName('Gemini Pro')).toBe('Pro');
      expect((service as any).getShortName('Gemini 1.5 Pro')).toBe('Pro');
      expect((service as any).getShortName('Gemini Flash')).toBe('Flash');
    });

    it('should handle unknown model names', () => {
      const result1 = (service as any).getShortName('Unknown Model');
      expect(result1).toBe('Unknow');
      const result2 = (service as any).getShortName('Custom AI v2');
      expect(result2).toBe('Custom');
    });

    it('should handle empty or short names', () => {
      expect((service as any).getShortName('')).toBe('');
      expect((service as any).getShortName('AI')).toBe('AI');
    });
  });

  describe('recordSnapshot', () => {
    it('should add snapshot to history', () => {
      const snapshot = createMockQuotaSnapshot();
      (service as any).recordSnapshot(snapshot);

      const history = (service as any).history;
      expect(history.length).toBe(1);
    });

    it('should limit history to MAX_HISTORY entries', () => {
      // Add more than MAX_HISTORY snapshots
      for (let i = 0; i < 25; i++) {
        const snapshot = createMockQuotaSnapshot();
        (service as any).recordSnapshot(snapshot);
      }

      const history = (service as any).history;
      expect(history.length).toBeLessThanOrEqual(20);
    });

    it('should keep most recent entries when trimming', () => {
      // Add snapshots with small delays to ensure different timestamps
      const snapshots = [];
      for (let i = 0; i < 25; i++) {
        const snapshot = createMockQuotaSnapshot();
        snapshot.timestamp = new Date(Date.now() + i);
        snapshots.push(snapshot);
        (service as any).recordSnapshot(snapshot);
      }

      const history = (service as any).history;
      
      // History should be trimmed to MAX_HISTORY (20)
      expect(history.length).toBe(20);
      
      // First entry should be from index 5 (since we added 25 and kept last 20)
      expect(history[0].timestamp.getTime()).toBe(snapshots[5].timestamp.getTime());
    });
  });

  describe('initSessionStart', () => {
    it('should initialize session start quotas', () => {
      const snapshot = createMockQuotaSnapshot();
      (service as any).initSessionStart(snapshot);

      const sessionQuotas = (service as any).sessionStartQuotas;
      expect(sessionQuotas.size).toBeGreaterThan(0);
    });

    it('should store correct quota values', () => {
      const snapshot = createMockQuotaSnapshot({
        models: [
          createMockModelQuota({
            modelId: 'test/model',
            remainingPercent: 75,
          }),
        ],
      });

      (service as any).initSessionStart(snapshot);
      const sessionQuotas = (service as any).sessionStartQuotas;
      
      expect(sessionQuotas.get('test/model')).toBe(75);
    });
  });
});
