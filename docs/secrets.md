# Secrets handling

- Never commit secrets. `.env` files are git-ignored; only `.env.example` (placeholders) is tracked.
- Production and staging secrets live in the hosting provider and GitHub Environments secrets, not in the repo.
- Client apps (web, mobile) get only public values. A database service-role key or any privileged key must never reach client code.
- Rotate a secret immediately if it appears in a commit, log or chat, and treat git history as compromised for that value.
- CI currently uses no secrets. When deploy secrets are added, scope them to environments with required reviewers.
- Enable GitHub secret scanning and push protection on the repository.
