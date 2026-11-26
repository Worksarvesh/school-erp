# Branch and pull request workflow

- `main` is always releasable and protected. No direct pushes.
- Work on short-lived branches from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `chore/<short-name>`.
- One logical change per PR; keep PRs small.
- PR titles are free-form. Conventional Commits (`feat(api): add attendance endpoint`) is recommended, and CI shows an advisory warning when a title does not follow it, but it never blocks a PR. Merge method is **squash**, so the PR title becomes the commit on `main`: keep it clear.
- `main` is protected by one repository ruleset (GitHub: Settings > Rules > Rulesets):
  - **main: PR + green CI required** (no bypass, applies to the owner too): require a PR, require the `CI passed` status check, require branches to be up to date with `main`, block force pushes and branch deletion, and require an approval when a PR contains changes not attributed to its author (for example AI co-authored commits). No general approval count is required.
  - There is no "only owner can merge" ruleset (removed 2026-11-25: it blocked every merge until the owner bypassed it). On a personal repository GitHub cannot limit merging to the owner, so collaborators with Write access can merge PRs that pass the ruleset. Restricting merges again needs an organization-owned repository and Maintain/Write roles.

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
