# Local setup (Windows PowerShell)

1. Install Git and Node.js 24. A version manager helps: `fnm` or `nvm-windows`.
2. Verify:
   ```powershell
   node -v      # v24.x
   git --version
   ```
3. Clone and install:
   ```powershell
   git clone <repository-url> school-erp
   cd school-erp
   corepack enable
   pnpm install
   ```
4. Copy the env template (only when an app needs it):
   ```powershell
   Copy-Item .env.example .env
   ```
   Then fill in your own local values. Never commit `.env`.
5. Start the local database (needs Docker Desktop running). Set the three `DB_*_PASSWORD` values in `.env` first, and use the same passwords in the two database URLs:
   ```powershell
   docker compose up -d --wait
   ```
   PostgreSQL 17 listens on `localhost:5434` with two databases, `school_erp` and `school_erp_test`, and two roles: `school_erp_owner` (migrations) and `school_erp_app` (the API; no `BYPASSRLS`). The roles are created only when the volume is first created. To start over, run `docker compose down -v`, which deletes all local data.
6. Run the API integration tests (needs the database from step 5):
   ```powershell
   pnpm --filter api run test:int
   ```
7. Run all checks:
   ```powershell
   pnpm run check
   ```

**If `corepack enable` fails with a permission error:** open PowerShell as Administrator once, or run `npm install -g pnpm@12.16.1` instead.

**Line endings:** the repo enforces LF through `.gitattributes` and `.editorconfig`. Keep VS Code's end-of-line setting on LF.

**Testing conventions:** unit tests live next to the code as `*.test.ts`; tests run with Vitest in shared packages. The API will add integration tests against a real PostgreSQL instance.
