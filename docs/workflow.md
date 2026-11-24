# Branch and pull request workflow

- `main` is always releasable and protected. No direct pushes.
- Work on short-lived branches from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `chore/<short-name>`.
- One logical change per PR; keep PRs small.
- PR titles are free-form. Conventional Commits (`feat(api): add attendance endpoint`) is recommended, and CI shows an advisory warning when a title does not follow it, but it never blocks a PR. Merge method is **squash**, so the PR title becomes the commit on `main`: keep it clear.
- `main` is protected by two repository rulesets (GitHub: Settings > Rules > Rulesets):
  - **main: only owner can merge**: restricts updates to `main`. Only the repository **Admin** role (the owner) can bypass it, and only through a pull request. Collaborators with Write access can push branches and open PRs, but cannot merge them. To let a future maintainer merge, give them the Maintain role and add the Maintain role (`actor_id` 2) as a pull-request-only bypass actor on this ruleset; this is a security decision for the owner.
  - **main: PR + green CI required** (no bypass, applies to the owner too): require a PR, require the `CI passed` status check, require branches to be up to date with `main`, block force pushes and branch deletion. No approval count is required because the owner is the only merger and reviews every PR before merging.

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
