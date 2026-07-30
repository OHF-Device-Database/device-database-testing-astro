import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslint from "@eslint/js";
import { configs } from "eslint-plugin-lit";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	comments.recommended,
	{
		rules: {
			"@eslint-community/eslint-comments/require-description": "error",
		},
	},
	configs["flat/recommended"],
	{
		files: ["src/**/*.ts"],
		plugins: {
			unicorn,
		},
		rules: {
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"prefer-named-capture-group": "error",

			// --- suspicious ---
			"no-label-var": "off",
			"no-restricted-syntax": [
				"error",
				{
					selector: "ForInStatement",
					message: "Use for...of or Object.keys() instead of for...in.",
				},
				{
					selector: "UnaryExpression[operator='delete']",
					message:
						"Avoid delete operator. Use destructuring, Map, or Set instead.",
				},
			],

			// --- style ---
			"@typescript-eslint/array-type": ["error", { default: "array" }],
			"arrow-body-style": ["error", "as-needed"],
			"@typescript-eslint/method-signature-style": ["error", "property"],
			"no-restricted-exports": [
				"error",
				{
					restrictDefaultExports: {
						direct: true,
						named: true,
						defaultFrom: true,
						namedFrom: true,
						namespaceFrom: true,
					},
				},
			],
			"unicorn/prefer-at": "error",
			"unicorn/prefer-string-trim-start-end": "error",

			// --- performance (noDelete covered by no-restricted-syntax above) ---
		},
	},
	{
		files: ["src/**/*.test.ts"],
		rules: {
			"@typescript-eslint/no-floating-promises": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
		},
	},
	{
		ignores: ["dist/**", "node_modules/**", ".astro/**"],
	},
);
