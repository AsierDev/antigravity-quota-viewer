/**
 * Mock data helpers for tests
 */

import {
  ServerUserStatusResponse,
  QuotaSnapshot,
  ProcessInfo,
  ModelQuota,
  PromptCredits,
} from '../../types';

/**
 * Create a mock ServerUserStatusResponse
 */
export function createMockServerResponse(
  overrides?: Partial<ServerUserStatusResponse>
): ServerUserStatusResponse {
  const defaultResponse: ServerUserStatusResponse = {
    userStatus: {
      planStatus: {
        planInfo: {
          monthlyPromptCredits: 500,
        },
        availablePromptCredits: 350,
      },
      cascadeModelConfigData: {
        clientModelConfigs: [
          {
            label: 'Claude 3.5 Sonnet',
            modelOrAlias: {
              model: 'anthropic/claude-3.5-sonnet',
            },
            quotaInfo: {
              remainingFraction: 0.75,
              resetTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            },
          },
          {
            label: 'GPT-4',
            modelOrAlias: {
              model: 'openai/gpt-4',
            },
            quotaInfo: {
              remainingFraction: 0.5,
              resetTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            },
          },
          {
            label: 'Gemini Pro',
            modelOrAlias: {
              model: 'google/gemini-pro',
            },
            quotaInfo: {
              remainingFraction: 0,
              resetTime: new Date(Date.now() + 1800000).toISOString(), // 30 mins from now
            },
          },
        ],
      },
    },
  };

  return {
    ...defaultResponse,
    ...overrides,
  };
}

/**
 * Create a mock ModelQuota
 */
export function createMockModelQuota(
  overrides?: Partial<ModelQuota>
): ModelQuota {
  const resetTime = new Date(Date.now() + 3600000);
  const timeUntilReset = resetTime.getTime() - Date.now();

  return {
    label: 'Claude 3.5 Sonnet',
    modelId: 'anthropic/claude-3.5-sonnet',
    remainingFraction: 0.75,
    remainingPercent: 75,
    isExhausted: false,
    resetTime,
    timeUntilReset,
    timeUntilResetFormatted: '1h',
    ...overrides,
  };
}

/**
 * Create a mock PromptCredits
 */
export function createMockPromptCredits(
  overrides?: Partial<PromptCredits>
): PromptCredits {
  return {
    available: 350,
    monthly: 500,
    usedPercentage: 30,
    remainingPercentage: 70,
    ...overrides,
  };
}

/**
 * Create a mock QuotaSnapshot
 */
export function createMockQuotaSnapshot(
  overrides?: Partial<QuotaSnapshot>
): QuotaSnapshot {
  return {
    timestamp: new Date(),
    models: [
      createMockModelQuota(),
      createMockModelQuota({
        label: 'GPT-4',
        modelId: 'openai/gpt-4',
        remainingFraction: 0.5,
        remainingPercent: 50,
      }),
    ],
    promptCredits: createMockPromptCredits(),
    ...overrides,
  };
}

/**
 * Create a mock ProcessInfo
 */
export function createMockProcessInfo(
  overrides?: Partial<ProcessInfo>
): ProcessInfo {
  return {
    pid: 12345,
    extensionPort: 42100,
    connectPort: 42101,
    csrfToken: 'mock-csrf-token-123',
    ...overrides,
  };
}

/**
 * Create a mock ServerUserStatusResponse with no prompt credits
 */
export function createMockServerResponseNoCredits(): ServerUserStatusResponse {
  return {
    userStatus: {
      cascadeModelConfigData: {
        clientModelConfigs: [
          {
            label: 'Claude 3.5 Sonnet',
            modelOrAlias: {
              model: 'anthropic/claude-3.5-sonnet',
            },
            quotaInfo: {
              remainingFraction: 0.75,
              resetTime: new Date(Date.now() + 3600000).toISOString(),
            },
          },
        ],
      },
    },
  };
}

/**
 * Create a mock ServerUserStatusResponse with exhausted models
 */
export function createMockServerResponseExhausted(): ServerUserStatusResponse {
  return {
    userStatus: {
      planStatus: {
        planInfo: {
          monthlyPromptCredits: 500,
        },
        availablePromptCredits: 10,
      },
      cascadeModelConfigData: {
        clientModelConfigs: [
          {
            label: 'Claude 3.5 Sonnet',
            modelOrAlias: {
              model: 'anthropic/claude-3.5-sonnet',
            },
            quotaInfo: {
              remainingFraction: 0,
              resetTime: new Date(Date.now() + 1800000).toISOString(),
            },
          },
          {
            label: 'GPT-4',
            modelOrAlias: {
              model: 'openai/gpt-4',
            },
            quotaInfo: {
              remainingFraction: 0.05,
              resetTime: new Date(Date.now() + 900000).toISOString(),
            },
          },
        ],
      },
    },
  };
}
