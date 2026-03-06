import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            'dist/**',
            'dist-electron/**',
            'release/**',
            'node_modules/**',
            '*.config.js',
            '*.config.ts',
            '*.config.cjs',
            'drizzle/**',
            '.vscode/**',
            // Standalone utility scripts (not part of the app)
            'reset_key*.{ts,js}',
            'reproduction_*.ts',
            'scripts/**',
            // shadcn/ui generated files
            'src/components/ui/**',
        ],
    },

    // Base JS recommended
    js.configs.recommended,

    // TypeScript recommended (type-aware disabled to keep lint fast)
    ...tseslint.configs.recommended,

    // Prettier must be last to override formatting rules
    eslintConfigPrettier,

    // Shared settings for all TS/JS files
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.es2024,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/ban-ts-comment': [
                'warn',
                {
                    'ts-ignore': 'allow-with-description',
                    'ts-nocheck': 'allow-with-description',
                    'ts-expect-error': 'allow-with-description',
                },
            ],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'warn',
            // Pre-existing patterns — warn to track, fix incrementally
            'preserve-caught-error': 'warn',
        },
    },

    // React frontend files
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },

    // Electron main process files
    {
        files: ['electron/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Backend uses electron-log, not console
            'no-console': 'error',
        },
    },

    // Test files — allow console.log and any
    {
        files: ['test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);
