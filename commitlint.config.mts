import type { UserConfig } from '@commitlint/types';
import { RuleConfigSeverity } from '@commitlint/types';

const Configuration: UserConfig = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			RuleConfigSeverity.Error,
			'always',
			[
				'feat',
				'fix',
				'docs',
				'style',
				'refactor',
				'perf',
				'test',
				'chore',
				'ci',
				'revert',
			],
		],
		'type-case': [RuleConfigSeverity.Error, 'always', 'lowercase'],
		'type-empty': [RuleConfigSeverity.Error, 'never'],
		'scope-empty': [RuleConfigSeverity.Warning, 'always'],
		'scope-case': [RuleConfigSeverity.Error, 'always', 'lowercase'],
		'scope-max-length': [RuleConfigSeverity.Error, 'always', 10],
		'header-max-length': [RuleConfigSeverity.Error, 'always', 100],
		'subject-case': [RuleConfigSeverity.Error, 'never', ['start-case', 'pascal-case', 'upper-case']],
		'subject-empty': [RuleConfigSeverity.Error, 'never'],
		'subject-full-stop': [RuleConfigSeverity.Error, 'never', '.'],
	},
};

export default Configuration;
