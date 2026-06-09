const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

/**
 * Monorepo pnpm, résolution des modules depuis le workspace root
 * sans l'ajouter à watchFolders (évite que Metro confonde le workspace
 * root avec un projet source lors du bundle release).
 */
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force une seule instance de React — override dur via resolveRequest
// (zustand pnpm embarque son propre node_modules/react, extraNodeModules ne suffit pas)
const reactRoot = path.resolve(workspaceRoot, 'node_modules', 'react');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { filePath: path.join(reactRoot, 'index.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Expose les dossiers workspace au watcher (pour le hot reload en dev)
// mais uniquement les packages partageables, pas la racine entière
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(workspaceRoot, 'packages'),  // packages/ partagés si existants
].filter(f => {
  try { require('fs').statSync(f); return true; } catch { return false; }
});

module.exports = config;
