import type { UserConfig, Rule } from '@commitlint/types';
import { RuleConfigSeverity } from '@commitlint/types';

// Types that require scope to be a GitHub issue number (e.g., #13)
const typesRequiringScope = ['feat', 'docs', 'style', 'refactor', 'perf', 'test', 'ci', 'revert'];

// Types where scope is optional, but if provided must be a GitHub issue number
const typesWithOptionalScope = ['fix', 'chore'];

/**
 * Custom rule to enforce GitHub issue number scope format.
 * For certain types, scope is required and must match #<digits>.
 * For fix and chore, scope is optional but if provided must match #<digits>.
 */
const scopeGitHubIssueRule: Rule = (parsed) => {
	const { type, scope } = parsed;

	// Scope format validation: must be #<digits> if present
	const scopeRegex = /^#\d+$/;

	if (typesRequiringScope.includes(type)) {
		// These types REQUIRE a scope in #<digits> format
		if (!scope) {
			return [false, `scope is required for type "${type}" and must match #<digits> (e.g., #13)`];
		}
		if (!scopeRegex.test(scope)) {
			return [
				false,
				`scope for type "${type}" must match #<digits> format (e.g., #13), got "${scope}"`,
			];
		}
		return [true];
	}

	if (typesWithOptionalScope.includes(type)) {
		// These types have OPTIONAL scope, but if provided must be in #<digits> format
		if (scope && !scopeRegex.test(scope)) {
			return [
				false,
				`scope for type "${type}" must match #<digits> format (e.g., #13), got "${scope}"`,
			];
		}
		return [true];
	}

	// For any other type, let default rules handle it
	return [true];
};

const Configuration: UserConfig = {
	extends: ['@commitlint/config-conventional'],
	plugins: [
		{
			rules: {
				'scope-github-issue': scopeGitHubIssueRule,
			},
		},
	],
	rules: {
		'type-enum': [
			RuleConfigSeverity.Error,
			'always',
			['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'revert'],
		],
		'type-case': [RuleConfigSeverity.Error, 'always', 'lowercase'],
		'type-empty': [RuleConfigSeverity.Error, 'never'],
		'scope-github-issue': [RuleConfigSeverity.Error, 'always'],
		'scope-case': [RuleConfigSeverity.Error, 'always', 'lowercase'],
		'scope-max-length': [RuleConfigSeverity.Error, 'always', 11],
		'header-max-length': [RuleConfigSeverity.Error, 'always', 100],
		'subject-case': [
			RuleConfigSeverity.Error,
			'never',
			['start-case', 'pascal-case', 'upper-case'],
		],
		'subject-empty': [RuleConfigSeverity.Error, 'never'],
		'subject-full-stop': [RuleConfigSeverity.Error, 'never', '.'],
	},
};

export default Configuration;
