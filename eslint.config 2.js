import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: './src/tsconfig.json',
        sourceType: 'module',
      },
    },
    files: ['**/*.ts'],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Add any specific ESLint rules here
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];