import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic, // Adds style-related rules
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022, // Updated from 2020
      globals: {
        ...globals.node, // Changed from browser to node
      },
      parserOptions: {
        project: './tsconfig.json', // Needed for rules that require type information
      },
    },
    rules: {
      // Rules that need custom configuration
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      
      // Rules not included in the extended configs
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      
      // Important for Express/Socket.IO async handlers
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false, // Allow void returns for Express middleware
        },
      ],
      
      // Customize console usage for server logging
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      
      // Database-related rule customization
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    },
  },
)
