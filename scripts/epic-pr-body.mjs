#!/usr/bin/env node
// Run by .github/workflows/epic-automation.yml's epic-pr-body job on every
// push to a PR from an epic/** branch. Rewrites only the text between the
// epic-summary markers in .github/pull_request_template.md, preserving any
// hand-written prose above them.
import { execFileSync } from 'node:child_process';

const START_MARKER = '<!-- epic-summary:start -->';
const END_MARKER = '<!-- epic-summary:end -->';

const TYPE_LABELS = {
	feat: 'Features',
	fix: 'Fixes',
	docs: 'Docs',
	style: 'Style',
	refactor: 'Refactors',
	perf: 'Performance',
	test: 'Tests',
	chore: 'Chores',
	ci: 'CI',
	revert: 'Reverts',
};

function gh(args, options = {}) {
	return execFileSync('gh', args, { encoding: 'utf8', ...options });
}

function git(args) {
	return execFileSync('git', args, { encoding: 'utf8' });
}

function parseEpicNumber(headRef) {
	const match = headRef.match(/^epic\/(\d+)\//);
	return match ? Number(match[1]) : null;
}

function buildChecklist(repo, epicNumber) {
	const subIssues = JSON.parse(gh(['api', `repos/${repo}/issues/${epicNumber}/sub_issues`]));
	if (subIssues.length === 0) return '_No linked feature issues._';
	return subIssues
		.map((issue) => `- [${issue.state === 'closed' ? 'x' : ' '}] #${issue.number} ${issue.title}`)
		.join('\n');
}

function buildChangelog() {
	const log = git(['log', 'origin/main..HEAD', '--format=%s']).trim();
	if (!log) return '_No commits yet._';

	const groups = new Map();
	for (const subject of log.split('\n')) {
		const match = subject.match(/^([a-z]+)(\([^)]*\))?:\s*(.+)$/);
		const type = match ? match[1] : 'other';
		const description = match ? match[3] : subject;
		if (!groups.has(type)) groups.set(type, []);
		groups.get(type).push(description);
	}

	const order = [...Object.keys(TYPE_LABELS), 'other'];
	return order
		.filter((type) => groups.has(type))
		.map((type) => {
			const label = TYPE_LABELS[type] ?? 'Other';
			const items = groups
				.get(type)
				.map((desc) => `- ${desc}`)
				.join('\n');
			return `**${label}:**\n${items}`;
		})
		.join('\n\n');
}

function spliceBody(currentBody, summary) {
	const block = `${START_MARKER}\n${summary}\n${END_MARKER}`;
	const startIdx = currentBody.indexOf(START_MARKER);
	const endIdx = currentBody.indexOf(END_MARKER);
	if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
		return currentBody.slice(0, startIdx) + block + currentBody.slice(endIdx + END_MARKER.length);
	}
	const separator = currentBody.trim() ? '\n\n' : '';
	return `${currentBody}${separator}${block}\n`;
}

function main() {
	const repo = process.env.GITHUB_REPOSITORY;
	const prNumber = process.env.PR_NUMBER;
	const headRef = process.env.HEAD_REF;

	if (!repo || !prNumber || !headRef) {
		throw new Error('GITHUB_REPOSITORY, PR_NUMBER, and HEAD_REF env vars are required.');
	}

	const epicNumber = parseEpicNumber(headRef);
	if (epicNumber === null) {
		console.log(`Head ref "${headRef}" doesn't match epic/<n>/<slug>; skipping.`);
		return;
	}

	const epic = JSON.parse(gh(['issue', 'view', String(epicNumber), '--json', 'title,url']));
	const summary = [
		`**Epic:** [#${epicNumber} ${epic.title}](${epic.url})`,
		'',
		'**Features:**',
		buildChecklist(repo, epicNumber),
		'',
		'**Changelog:**',
		buildChangelog(),
	].join('\n');

	const currentBody = JSON.parse(gh(['pr', 'view', prNumber, '--json', 'body'])).body ?? '';
	const newBody = spliceBody(currentBody, summary);

	gh(['pr', 'edit', prNumber, '--body-file', '-'], { input: newBody });
	console.log(`Updated PR #${prNumber} body for epic #${epicNumber}.`);
}

main();
