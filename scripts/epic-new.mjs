#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
	const args = { dryRun: false, branch: false, planPath: null };
	for (const arg of argv) {
		if (arg === '--dry-run') args.dryRun = true;
		else if (arg === '--branch') args.branch = true;
		else if (!arg.startsWith('--')) args.planPath = arg;
		else throw new Error(`Unknown flag: ${arg}`);
	}
	if (!args.planPath) {
		throw new Error('Usage: node scripts/epic-new.mjs <path-to-plan.md> [--dry-run] [--branch]');
	}
	return args;
}

function assertGhReady() {
	try {
		execFileSync('gh', ['--version'], { stdio: 'ignore' });
	} catch {
		throw new Error('gh CLI not found on PATH. Install it: https://cli.github.com');
	}
	try {
		execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
	} catch {
		throw new Error('gh is not authenticated. Run: gh auth login');
	}
}

function kebabCase(title) {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function stripIssueNumber(heading) {
	return heading.replace(/\s*#\d+\s*$/, '').trim();
}

function parsePlan(text) {
	const lines = text.split('\n');
	const slugMatch = text.match(/<!--\s*slug:\s*([a-z0-9-]+)\s*-->/i);

	const epicLineIndex = lines.findIndex((line) => line.startsWith('# '));
	if (epicLineIndex === -1) {
		throw new Error('Plan file must contain a "# <Epic title>" heading');
	}
	const epicTitle = stripIssueNumber(lines[epicLineIndex].slice(2));

	const featureHeadingIndexes = [];
	lines.forEach((line, index) => {
		if (line.startsWith('## ')) featureHeadingIndexes.push(index);
	});

	const epicBodyEnd = featureHeadingIndexes[0] ?? lines.length;
	const epicBody = lines
		.slice(epicLineIndex + 1, epicBodyEnd)
		.join('\n')
		.replace(/<!--\s*slug:\s*[a-z0-9-]+\s*-->/i, '')
		.trim();

	const features = featureHeadingIndexes.map((headingIndex, i) => {
		const end = featureHeadingIndexes[i + 1] ?? lines.length;
		return {
			headingIndex,
			title: stripIssueNumber(lines[headingIndex].slice(3)),
			body: lines
				.slice(headingIndex + 1, end)
				.join('\n')
				.trim(),
		};
	});

	return {
		lines,
		slug: slugMatch ? slugMatch[1] : kebabCase(epicTitle),
		epicLineIndex,
		epicTitle,
		epicBody,
		features,
	};
}

function ghCreateIssue({ title, body, label, parent, dryRun }) {
	const args = ['issue', 'create', '--title', title, '--body-file', '-', '--label', label];
	if (parent) args.push('--parent', String(parent));

	if (dryRun) {
		console.log(`[dry-run] gh ${args.join(' ')}`);
		console.log(`[dry-run]   body: ${body.split('\n')[0]}${body.includes('\n') ? ' […]' : ''}`);
		return null;
	}

	const output = execFileSync('gh', args, { input: body, encoding: 'utf8' });
	const match = output.trim().match(/\/issues\/(\d+)\s*$/);
	if (!match) {
		throw new Error(`Could not parse issue number from gh output: ${output}`);
	}
	return Number(match[1]);
}

function assertCleanMainForBranch() {
	const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
		encoding: 'utf8',
	}).trim();
	if (branch !== 'main') {
		throw new Error(`--branch requires being on "main" (currently on "${branch}")`);
	}
	const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
	if (status.trim() !== '') {
		throw new Error('--branch requires a clean working tree');
	}
}

function createEpicBranch(epicNumber, slug, dryRun) {
	const branchName = `epic/${epicNumber}/${slug}`;
	if (dryRun) {
		console.log(`[dry-run] git switch -c ${branchName}`);
		console.log(`[dry-run] git push -u origin ${branchName}`);
		return branchName;
	}
	execFileSync('git', ['switch', '-c', branchName], { stdio: 'inherit' });
	execFileSync('git', ['push', '-u', 'origin', branchName], { stdio: 'inherit' });
	return branchName;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	assertGhReady();

	if (args.branch && !args.dryRun) {
		assertCleanMainForBranch();
	}

	const planPath = resolve(args.planPath);
	const plan = parsePlan(readFileSync(planPath, 'utf8'));

	console.log(`Epic: ${plan.epicTitle}`);
	console.log(`Slug: ${plan.slug}`);
	console.log(`Features: ${plan.features.length}`);

	const epicNumber = ghCreateIssue({
		title: plan.epicTitle,
		body: plan.epicBody,
		label: 'epic',
		dryRun: args.dryRun,
	});

	const featureNumbers = plan.features.map((feature) =>
		ghCreateIssue({
			title: feature.title,
			body: feature.body,
			label: 'feature',
			parent: epicNumber ?? '<epic>',
			dryRun: args.dryRun,
		})
	);

	if (!args.dryRun) {
		const updatedLines = [...plan.lines];
		updatedLines[plan.epicLineIndex] = `# ${plan.epicTitle} #${epicNumber}`;
		plan.features.forEach((feature, i) => {
			updatedLines[feature.headingIndex] = `## ${feature.title} #${featureNumbers[i]}`;
		});
		writeFileSync(planPath, updatedLines.join('\n'));
		console.log(`Updated ${planPath} with issue numbers.`);
	}

	if (args.branch) {
		const branchName = createEpicBranch(epicNumber ?? '<epic>', plan.slug, args.dryRun);
		console.log(`Branch: ${branchName}`);
	}
}

main();
