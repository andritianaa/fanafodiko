/**
 * PM2, Frontend Fanafodiko (Vite preview, build statique)
 *
 * Prérequis : pnpm build (génère ./dist)
 *
 * Dans un workspace pnpm, vite est dans le node_modules/ de la RACINE
 * du monorepo, pas dans apps/frontend/node_modules/.
 * On calcule le chemin absolu dynamiquement.
 */

const path = require('path');

// apps/frontend → ../../ → racine du workspace
const workspaceRoot = path.resolve(__dirname, '..', '..');
const viteBin = path.join(workspaceRoot, 'node_modules', '.bin', 'vite');

module.exports = {
  apps: [
    {
      name: 'fanafodiko-frontend',
      script: viteBin,
      args: 'preview --port 9992 --host 0.0.0.0',
      interpreter: 'node',
      cwd: __dirname,

      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 2000,

      env: {
        NODE_ENV: 'production',
      },

      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
