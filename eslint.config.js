
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import eslintPluginReactCompiler from 'eslint-plugin-react-compiler';
import pluginNext from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '.next/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: {
      '@eslint-react': eslintReact,
      '@typescript-eslint': tseslint.plugin,
      'react-compiler': eslintPluginReactCompiler,
      '@next/next': pluginNext,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...eslintReact.configs.recommended.rules,
      ...eslintReact.configs['recommended-dom'].rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      'react-compiler/react-compiler': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['functions/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  }
);
