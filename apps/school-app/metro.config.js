/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch monorepo root and shared workspace packages
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from local node_modules then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. TypeScript-style ".js" imports: source files import "./x.js" but the file on disk is
//    x.ts or x.tsx. For relative imports ending in ".js", try .ts then .tsx, and fall back to
//    the default resolution (a real .js file, or any other error) when neither exists.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const base = moduleName.slice(0, -3);
    for (const ext of ['.ts', '.tsx']) {
      try {
        return resolve(context, base + ext, platform);
      } catch {
        // not found with this extension: try the next one
      }
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
