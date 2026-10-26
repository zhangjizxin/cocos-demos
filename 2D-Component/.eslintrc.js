module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'import/no-unresolved': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  globals: {
    cc: true
  }
};
