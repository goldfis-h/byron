// eslint.config.js
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');
const prettier = require('prettier');
const vuePlugin = require('eslint-plugin-vue');

// 尝试获取 Prettier 配置（兼容 v2 和 v3）
function getPrettierConfig() {
  try {
    // 先尝试异步方法（适用于 Prettier v3）
    if (prettier.resolveConfig) {
      return prettier.resolveConfig.sync(process.cwd()) || {};
    }
    // 回退到旧方法（适用于 Prettier v2）
    return require('prettier/parser-babel').default || {};
  } catch {
    return {};
  }
}

// 同步获取配置
const prettierOptions = getPrettierConfig();

// ESLint 推荐规则（手动定义，避免使用已移除的路径）
const eslintRecommendedRules = {
  'no-console': 'warn',
  'no-debugger': 'error',
  'no-unused-vars': 'off', // 由 @typescript-eslint/no-unused-vars 处理
  'valid-typeof': 'error',
};

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
  // ESLint 推荐规则
  { rules: eslintRecommendedRules },
  // TypeScript 推荐规则
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  // Vue 支持
  {
    ...vuePlugin.configs.recommended,
    files: ['**/*.vue'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  // Prettier 集成
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': ['error', prettierOptions],
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];
