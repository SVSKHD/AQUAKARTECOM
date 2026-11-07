import * as espree from "espree";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    settings: {
      // eslint-plugin-react's "detect" calls context.getFilename(), which
      // ESLint 10 removed (lint crashed on every file). Pin the major instead.
      react: { version: "19" },
    },
    // Carried over from the legacy .eslintrc.json (ESLint 10 ignores it).
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // eslint-config-next parses JS with its bundled Babel parser, whose scope
    // manager lacks addGlobals() and crashes ESLint 10. Use ESLint's own
    // parser (espree, ships with eslint) for JS/JSX instead.
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: espree,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];

export default config;
