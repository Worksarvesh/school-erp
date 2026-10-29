# Branch and pull request workflow

- `main` is always releasable and protected. No direct pushes.
- Work on short-lived branches from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `chore/<short-name>`.
- One logical change per PR; keep PRs small.
- PR title uses Conventional Commits: `feat(api): add attendance endpoint`. CI checks this. Merge method is **squash**, so the PR title becomes the commit on `main`.
- Branch protection on `main` (configure in GitHub settings): require a PR, require 1 approval, require the `CI passed` status check, require branches to be up to date, block force pushes, dismiss stale approvals.

## Daily flow (PowerShell)

```powershell
git switch main
git pull
git switch -c feat/attendance-model
# ...work, then:
pnpm run check
git add -A
git commit -m "feat(api): add attendance model"
git push -u origin feat/attendance-model
# open a pull request on GitHub
```

## Avoid overwriting teammates' work

- Pull `main` often; rebase or merge `main` into your branch before opening the PR.
- Never force-push a shared branch. Two people on one branch: coordinate and `git pull` before every push.
- Own distinct areas: frontend devs in `apps/web`/`apps/mobile`, backend devs in `apps/api`. Changes to `packages/shared-types` need review from both sides.
