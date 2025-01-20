module.exports = {
  rules: {
    'no-unused-vars': 'warn',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'off',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'import/order': 'off',
  },
  plugins: ['unused-imports'],
}
