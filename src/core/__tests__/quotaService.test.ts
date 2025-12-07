/**
 * Tests for QuotaService
 */

import { QuotaService } from '../quotaService';
import {
  createMockServerResponse,
  createMockServerResponseNoCredits,
  createMockServerResponseExhausted,
} from '../../__tests__/helpers/mockData';

describe('QuotaService', () => {
  let service: QuotaService;

  beforeEach(() => {
    service = new QuotaService();
  });

  describe('setConnection', () => {
    it('should set connection parameters', () => {
      service.setConnection(42101, 'test-csrf-token');
      expect(service.isConfigured()).toBe(true);
    });

    it('should update connection parameters when called multiple times', () => {
      service.setConnection(42101, 'token1');
      expect(service.isConfigured()).toBe(true);

      service.setConnection(42102, 'token2');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('isConfigured', () => {
    it('should return false when not configured', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when only port is set', () => {
      service.setConnection(42101, '');
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when only token is set', () => {
      service.setConnection(0, 'test-token');
      expect(service.isConfigured()).toBe(false);
    });

    it('should return true when both port and token are set', () => {
      service.setConnection(42101, 'test-token');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('getSnapshot', () => {
    it('should return null initially', () => {
      expect(service.getSnapshot()).toBeNull();
    });

    it('should return the last snapshot after parsing', () => {
      const mockResponse = createMockServerResponse();
      const snapshot = (service as any).parseResponse(mockResponse);
      (service as any).lastSnapshot = snapshot;

      const retrieved = service.getSnapshot();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.models.length).toBeGreaterThan(0);
    });
  });

  describe('parseResponse', () => {
    it('should parse a complete server response correctly', () => {
      const mockResponse = createMockServerResponse();
      const snapshot = (service as any).parseResponse(mockResponse);

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.models).toHaveLength(3);
      expect(snapshot.promptCredits).toBeDefined();
      expect(snapshot.promptCredits?.monthly).toBe(500);
      expect(snapshot.promptCredits?.available).toBe(350);
    });

    it('should parse models correctly', () => {
      const mockResponse = createMockServerResponse();
      const snapshot = (service as any).parseResponse(mockResponse);

      const claudeModel = snapshot.models.find(
        (m: any) => m.label === 'Claude 3.5 Sonnet'
      );
      expect(claudeModel).toBeDefined();
      expect(claudeModel?.modelId).toBe('anthropic/claude-3.5-sonnet');
      expect(claudeModel?.remainingFraction).toBe(0.75);
      expect(claudeModel?.remainingPercent).toBe(75);
      expect(claudeModel?.isExhausted).toBe(false);
      expect(claudeModel?.resetTime).toBeInstanceOf(Date);
    });

    it('should identify exhausted models', () => {
      const mockResponse = createMockServerResponseExhausted();
      const snapshot = (service as any).parseResponse(mockResponse);

      const exhaustedModel = snapshot.models.find(
        (m: any) => m.remainingFraction === 0
      );
      expect(exhaustedModel).toBeDefined();
      expect(exhaustedModel?.isExhausted).toBe(true);
    });

    it('should handle missing prompt credits gracefully', () => {
      const mockResponse = createMockServerResponseNoCredits();
      const snapshot = (service as any).parseResponse(mockResponse);

      expect(snapshot.promptCredits).toBeUndefined();
      expect(snapshot.models.length).toBeGreaterThan(0);
    });

    it('should calculate prompt credits percentages correctly', () => {
      const mockResponse = createMockServerResponse();
      const snapshot = (service as any).parseResponse(mockResponse);

      expect(snapshot.promptCredits?.usedPercentage).toBe(30);
      expect(snapshot.promptCredits?.remainingPercentage).toBe(70);
    });

    it('should filter out models without quota info', () => {
      const mockResponse = createMockServerResponse();
      mockResponse.userStatus.cascadeModelConfigData!.clientModelConfigs!.push({
        label: 'Model Without Quota',
        modelOrAlias: { model: 'test/no-quota' },
      });

      const snapshot = (service as any).parseResponse(mockResponse);
      const noQuotaModel = snapshot.models.find(
        (m: any) => m.label === 'Model Without Quota'
      );
      expect(noQuotaModel).toBeUndefined();
    });

    it('should handle empty model configs', () => {
      const mockResponse: any = {
        userStatus: {
          cascadeModelConfigData: {
            clientModelConfigs: [],
          },
        },
      };

      const snapshot = (service as any).parseResponse(mockResponse);
      expect(snapshot.models).toHaveLength(0);
    });
  });

  describe('formatTime', () => {
    it('should format negative or zero time as "Ready"', () => {
      expect((service as any).formatTime(0)).toBe('Ready');
      expect((service as any).formatTime(-1000)).toBe('Ready');
    });

    it('should format minutes correctly', () => {
      expect((service as any).formatTime(60000)).toBe('1m'); // 1 minute
      expect((service as any).formatTime(1800000)).toBe('30m'); // 30 minutes
      expect((service as any).formatTime(3540000)).toBe('59m'); // 59 minutes
    });

    it('should format hours correctly', () => {
      expect((service as any).formatTime(3600000)).toBe('1h'); // 1 hour
      expect((service as any).formatTime(7200000)).toBe('2h'); // 2 hours
      expect((service as any).formatTime(7260000)).toBe('2h 1m'); // 2 hours 1 minute
    });

    it('should format days correctly', () => {
      expect((service as any).formatTime(86400000)).toBe('1d'); // 1 day
      expect((service as any).formatTime(172800000)).toBe('2d'); // 2 days
      expect((service as any).formatTime(90000000)).toBe('1d 1h'); // 1 day 1 hour
    });

    it('should round up partial minutes', () => {
      expect((service as any).formatTime(30000)).toBe('1m'); // 30 seconds -> 1 minute
      expect((service as any).formatTime(90000)).toBe('2m'); // 1.5 minutes -> 2 minutes
    });
  });

  describe('poll', () => {
    it('should throw error when not configured', async () => {
      await expect(service.poll()).rejects.toThrow('QuotaService not configured');
    });

    it('should throw error when only port is configured', async () => {
      service.setConnection(42101, '');
      await expect(service.poll()).rejects.toThrow('QuotaService not configured');
    });

    it('should throw error when only token is configured', async () => {
      service.setConnection(0, 'test-token');
      await expect(service.poll()).rejects.toThrow('QuotaService not configured');
    });
  });

  describe('edge cases', () => {
    it('should handle response with missing userStatus', () => {
      const invalidResponse: any = {};
      expect(() => (service as any).parseResponse(invalidResponse)).toThrow();
    });

    it('should handle very large time values', () => {
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const formatted = (service as any).formatTime(oneYear);
      expect(formatted).toContain('d');
    });

    it('should handle models with missing resetTime', () => {
      const mockResponse = createMockServerResponse();
      mockResponse.userStatus.cascadeModelConfigData!.clientModelConfigs![0].quotaInfo!.resetTime = undefined;

      const snapshot = (service as any).parseResponse(mockResponse);
      expect(snapshot.models[0].resetTime).toBeInstanceOf(Date);
    });

    it('should handle models with remainingFraction undefined', () => {
      const mockResponse = createMockServerResponse();
      mockResponse.userStatus.cascadeModelConfigData!.clientModelConfigs![0].quotaInfo!.remainingFraction = undefined;

      const snapshot = (service as any).parseResponse(mockResponse);
      expect(snapshot.models[0].remainingFraction).toBe(1);
      expect(snapshot.models[0].remainingPercent).toBe(100);
    });
  });
});
