// Cross-platform clean (works in Windows PowerShell and CI). Removes build output only.
import { rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'packages'];
for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const target of ['dist', 'build', 'coverage']) {
      rmSync(join(root, entry.name, target), { recursive: true, force: true });
    }
  }
}
console.log('Cleaned build output.');
