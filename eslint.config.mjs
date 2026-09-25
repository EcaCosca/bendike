// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jest from 'eslint-plugin-jest';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/dist',
    '**/coverage',
    '**/node_modules',
    'apps/web/public/**',
    'apps/web/src/pages/about/scrollcraft/*.js',
    'design/scrollcraft/**',
  ]),
  {
    files: ['apps/web/scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // CloudFront Functions run on their own runtime, which calls a global `handler`.
    // Nothing in this repo imports it, so the unused-variable rule cannot see the caller.
    files: ['infra/cloudfront/**/*.js'],
    rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^handler$' }] },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended, eslintPluginPrettierRecommended],
  },
  {
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['**/*.spec.{ts,tsx}', '**/setupTests.ts'],
    plugins: { jest },
    languageOptions: {
      globals: jest.environments.globals.globals,
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/no-disabled-tests': 'error',
      'jest/expect-expect': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
);
