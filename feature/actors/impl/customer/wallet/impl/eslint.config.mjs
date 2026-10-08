import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint, { parser } from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{js,ts}"],
  extends: [
    js.configs.recommended,
    [
      ...tseslint.configs.recommended,
      {
        languageOptions: {
          parser,
          parserOptions: {
            project: ["./tsconfig.eslint.json"],
            tsconfigRootDir: import.meta.dirname,
          },
        },
        rules: {
          "@typescript-eslint/no-floating-promises": "warn",
          "@typescript-eslint/no-unused-vars": "warn",
        },
      },
    ],
  ],
});
