import nextConfig from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.vercel/**',
      'cypress/**',
      'coverage/**',
      'jest.config.js',
      'next.config.js',
      'postcss.config.js',
      'tailwind.config.ts',
      'cypress.config.ts',
    ],
  },
];

export default eslintConfig;
