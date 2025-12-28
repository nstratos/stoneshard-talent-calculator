export default [
  {
    files: ['**/*.js'],
    ignores: ['**/dist/**', '**/vendor/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': ['warn', { boolean: true }],
    },
  },
];
