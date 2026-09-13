import { nextJsConfig } from '@aquastock/config/eslint/next';

export default [
  {
    ignores: ['.next/**', 'build/**', 'out/**', 'coverage/**'],
  },
  ...nextJsConfig.map((config) => ({
    ...config,
    rules: {
      ...config.rules,
      'react/no-unknown-property': 'off',
    },
  })),
];
