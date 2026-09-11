import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@bendike/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.spec.{ts,tsx}', '!main.tsx', '!setupTests.ts', '!vite-env.d.ts'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'json'],
  clearMocks: true,
};

export default config;
