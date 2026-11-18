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

// 3. Fallback resolution for relative imports with .js extension pointing to .ts/.tsx files
const expoMetroConfig = require.resolve('expo/metro-config', { paths: [projectRoot] });
const metroResolver = require(require.resolve('metro-resolver', { paths: [expoMetroConfig] }));

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return metroResolver.resolve(context, moduleName, platform);
  } catch (error) {
    if (
      moduleName.endsWith('.js') &&
      (moduleName.startsWith('./') || moduleName.startsWith('../'))
    ) {
      const extensionless = moduleName.slice(0, -3);
      try {
        return metroResolver.resolve(context, extensionless, platform);
      } catch {
        throw error;
      }
    }
    throw error;
  }
};

module.exports = config;
