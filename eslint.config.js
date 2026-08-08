import js from '@eslint/js';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importXPlugin from 'eslint-plugin-import-x';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
	{
		ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
	},
	js.configs.recommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: './tsconfig.json',
			},
			globals: {
				...globals.node,
				...globals.es2020,
			},
		},
		plugins: {
			'@typescript-eslint': typescriptEslintPlugin,
			'import-x': importXPlugin,
			tsdoc: tsdocPlugin,
			jsdoc: jsdocPlugin,
		},
		rules: {
			...typescriptEslintPlugin.configs.recommended.rules,
			...typescriptEslintPlugin.configs['recommended-requiring-type-checking'].rules,
			...prettierConfig.rules,
			'tsdoc/syntax': 'error',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSEnumDeclaration',
					message: 'Use const with derived types instead of enums',
				},
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'default',
					format: ['camelCase'],
				},
				{
					selector: 'variable',
					format: ['camelCase', 'UPPER_CASE'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow',
					custom: {
						regex:
							'^(is|has|should|can|get|set|do|find|fetch|create|update|delete|add|remove|check)',
						match: false,
					},
				},
				{
					selector: 'function',
					format: ['camelCase'],
					custom: {
						regex:
							'^(is|has|should|can|get|set|do|find|fetch|create|update|delete|add|remove|check)',
						match: true,
					},
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
					suffix: ['T'],
				},
				{
					selector: 'enumMember',
					format: ['UPPER_CASE'],
				},
			],
			'import-x/no-default-export': 'error',
			'jsdoc/require-jsdoc': [
				'error',
				{
					publicOnly: true,
					require: {
						FunctionExpression: true,
						ClassDeclaration: true,
						ClassExpression: true,
						MethodDefinition: true,
						ArrowFunctionExpression: true,
					},
				},
			],
			'jsdoc/require-description': [
				'error',
				{
					contexts: ['any'],
				},
			],
			'jsdoc/require-param-description': 'error',
			'jsdoc/require-returns-description': 'error',
		},
	},
	{
		files: ['server/**/*.ts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: './tsconfig.json',
			},
			globals: {
				...globals.node,
				...globals.es2020,
			},
		},
		plugins: {
			'@typescript-eslint': typescriptEslintPlugin,
			'import-x': importXPlugin,
			tsdoc: tsdocPlugin,
			jsdoc: jsdocPlugin,
		},
		rules: {
			...typescriptEslintPlugin.configs.recommended.rules,
			...typescriptEslintPlugin.configs['recommended-requiring-type-checking'].rules,
			...prettierConfig.rules,
			'tsdoc/syntax': 'error',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSEnumDeclaration',
					message: 'Use const with derived types instead of enums',
				},
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'default',
					format: ['camelCase'],
				},
				{
					selector: 'variable',
					format: ['camelCase', 'UPPER_CASE'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow',
					custom: {
						regex:
							'^(is|has|should|can|get|set|do|find|fetch|create|update|delete|add|remove|check)',
						match: false,
					},
				},
				{
					selector: 'function',
					format: ['camelCase'],
					custom: {
						regex:
							'^(is|has|should|can|get|set|do|find|fetch|create|update|delete|add|remove|check)',
						match: true,
					},
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
					suffix: ['T'],
				},
				{
					selector: 'enumMember',
					format: ['UPPER_CASE'],
				},
			],
			'import-x/no-default-export': 'error',
			'jsdoc/require-jsdoc': [
				'error',
				{
					publicOnly: true,
					require: {
						FunctionExpression: true,
						ClassDeclaration: true,
						ClassExpression: true,
						MethodDefinition: true,
						ArrowFunctionExpression: true,
					},
				},
			],
			'jsdoc/require-description': [
				'error',
				{
					contexts: ['any'],
				},
			],
			'jsdoc/require-param-description': 'error',
			'jsdoc/require-returns-description': 'error',
		},
	},
	{
		files: ['src/**/*.tsx'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: './tsconfig.json',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
				...globals.es2020,
			},
		},
		plugins: {
			'@typescript-eslint': typescriptEslintPlugin,
			'import-x': importXPlugin,
			tsdoc: tsdocPlugin,
			jsdoc: jsdocPlugin,
		},
		rules: {
			...typescriptEslintPlugin.configs.recommended.rules,
			...typescriptEslintPlugin.configs['recommended-requiring-type-checking'].rules,
			...prettierConfig.rules,
			'tsdoc/syntax': 'error',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/naming-convention': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSEnumDeclaration',
					message: 'Use const with derived types instead of enums',
				},
			],
			'import-x/no-default-export': 'error',
			'jsdoc/require-jsdoc': [
				'error',
				{
					publicOnly: true,
					require: {
						FunctionExpression: true,
						ClassDeclaration: true,
						ClassExpression: true,
						MethodDefinition: true,
						ArrowFunctionExpression: true,
					},
				},
			],
			'jsdoc/require-description': [
				'error',
				{
					contexts: ['any'],
				},
			],
			'jsdoc/require-param-description': 'error',
			'jsdoc/require-returns-description': 'error',
		},
	},
];
