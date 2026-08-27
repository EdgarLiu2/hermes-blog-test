import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/**", "out/**", "node_modules/**", "coverage/**", "next-env.d.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        window: "readonly",
        document: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);
