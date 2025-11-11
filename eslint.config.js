import js from '@eslint/js';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['coverage/**','android/**','ios/**','node_modules/**','build/**','App_OLD_backup.js','src/screens/**','functions/**','src/ml/**']
  },
  js.configs.recommended,
  reactRecommended,
  prettier,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        __DEV__: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly'
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-native': reactNative
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    },
    settings: {
      react: { version: 'detect' }
    }
  },
  {
    files: ['**/__tests__/**','**/__mocks__/**'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off'
    }
  }
];
