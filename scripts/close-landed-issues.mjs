#!/usr/bin/env node
// Run by .github/workflows/epic-automation.yml's close-features job on every
// push to an epic/** branch. Closes feature issues whose commit scope landed
// in this push, reusing the merge-base fallback from .husky/pre-push.
import { execFileSync } from 'node:child_process';

const SCOPE_REGEX = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)\(#(\d+)\):/;
const ZERO_SHA = '0'.repeat(40);

function gh(args, options = {}) {
	return execFileSync('gh', args, { encoding: 'utf8', ...options });
}

function git(args) {
	return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function resolveRange() {
	const before = process.env.GITHUB_EVENT_BEFORE;
	const after = process.env.GITHUB_EVENT_AFTER || 'HEAD';
	const from = !before || before === ZERO_SHA ? git(['merge-base', 'origin/main', 'HEAD']) : before;
	return { from, to: after };
}

function extractIssueCommits(from, to) {
	const log = git(['log', '--no-merges', '--format=%H%x09%s', `${from}..${to}`]);
	if (!log) return [];
	return log
		.split('\n')
		.map((line) => {
			const [sha, subject] = line.split('\t');
			const match = subject.match(SCOPE_REGEX);
			return match ? { sha, issue: Number(match[2]) } : null;
		})
		.filter(Boolean);
}

function closeIssue({ sha, issue }, branch) {
	const details = JSON.parse(gh(['issue', 'view', String(issue), '--json', 'state,labels']));
	const isFeature = details.labels.some((label) => label.name === 'feature');
	if (!isFeature) {
		console.log(`Skipping #${issue}: not labeled "feature".`);
		return;
	}
	if (details.state === 'CLOSED') {
		console.log(`Skipping #${issue}: already closed.`);
		return;
	}
	const shortSha = sha.slice(0, 7);
	gh([
		'issue',
		'close',
		String(issue),
		'--reason',
		'completed',
		'--comment',
		`Landed on \`${branch}\` in ${shortSha}.`,
	]);
	console.log(`Closed #${issue} (${shortSha}).`);
}

function main() {
	const branch = process.env.GITHUB_REF_NAME;
	if (!branch) {
		throw new Error('GITHUB_REF_NAME env var is required.');
	}

	const { from, to } = resolveRange();
	console.log(`Scanning ${from}..${to} on ${branch}`);

	const commits = extractIssueCommits(from, to);
	if (commits.length === 0) {
		console.log('No issue-scoped commits found in range.');
		return;
	}

	for (const commit of commits) {
		closeIssue(commit, branch);
	}
}

main();
