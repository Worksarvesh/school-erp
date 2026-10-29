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
5. Run all checks:
   ```powershell
   pnpm run check
   ```

**If `corepack enable` fails with a permission error:** open PowerShell as Administrator once, or run `npm install -g pnpm@12.16.1` instead.

**Line endings:** the repo enforces LF through `.gitattributes` and `.editorconfig`. Keep VS Code's end-of-line setting on LF.

**Testing conventions:** unit tests live next to the code as `*.test.ts`; tests run with Vitest in shared packages. The API will add integration tests against a real PostgreSQL instance.
