import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
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
    plugins: {
      react,
    },
    rules: {
      // The blind spot this used to carry — `varsIgnorePattern: '^[A-Z_]'` — was
      // a pre-plugin workaround for core no-unused-vars being unable to see JSX
      // usage. Now that `react/jsx-uses-vars` below supplies that, the pattern
      // only hid genuinely dead imports (22 of them, mostly lucide icons).
      // Keep this rule honest: it is the only thing catching unused imports.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Core `no-unused-vars` has no JSX awareness, so any identifier referenced
      // only inside JSX (`<motion.div>`, `<Icon />`) was reported as unused.
      // These two rules teach the linter about JSX usage without pulling in the
      // full React recommended set (which would demand prop-types everywhere).
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
])
