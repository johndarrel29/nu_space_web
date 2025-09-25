import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended", 'plugin:react/recommended'],
    languageOptions: { globals: globals.browser },
    rules: {
      "no-unused-vars": "warn",
      "no-console": ["error", { allow: ["warn", "error"] }]
    }
  },
  pluginReact.configs.flat.recommended,
]);
