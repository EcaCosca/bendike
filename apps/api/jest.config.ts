import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.module.ts',
    '!**/*.factory.ts',
    '!**/dto/**',
    '!**/migrations/**',
    '!database/data-source.ts',
    '!main.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'json'],
  testEnvironment: 'node',
  clearMocks: true,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
