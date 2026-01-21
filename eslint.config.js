import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'public', 'lint.txt']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_'
      }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Clean Architecture: Domain Isolation
  {
    files: ['src/domain/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../infrastructure/*', '**/infrastructure/*'],
            message: 'Domain layer cannot import from Infrastructure layer.'
          },
          {
            group: ['../components/*', '**/components/*'],
            message: 'Domain layer cannot import from Presentation layer (Components).'
          },
          {
            group: ['../application/*', '**/application/*'],
            message: 'Domain layer cannot import from Application layer (Use Cases).'
          }
        ]
      }]
    }
  },
])
