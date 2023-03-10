/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  globals: {
    lx: true
  },
  overrides: [
    {
      files: [
        '*.ts',
        '*.tsx',
        '*.vue'
      ],
      rules: {
        'no-undef': 'off'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
