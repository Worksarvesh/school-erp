// Validates a pull request title against Conventional Commits.
// Usage: PR_TITLE="feat(api): add login" node scripts/check-pr-title.mjs
const title = (process.env.PR_TITLE ?? process.argv[2] ?? '').trim();
const pattern =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9-]*\))?!?: \S.{2,}$/;

if (!pattern.test(title)) {
  console.error(`Invalid PR title: "${title}"`);
  console.error('Expected: <type>(<optional-scope>): <description>');
  console.error('Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert');
  console.error('Example: feat(api): add principal registration endpoint');
  process.exit(1);
}
console.log(`PR title OK: "${title}"`);
