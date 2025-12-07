module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],
  coverageThresholds: {
    'src/core/quotaService.ts': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
    'src/insights/insightsService.ts': {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    'src/core/processDetector.ts': {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
};
