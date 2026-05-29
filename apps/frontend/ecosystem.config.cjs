/**
 * PM2 — Frontend Fanafodiko (Vite preview, build statique)
 *
 * Prérequis : avoir buildé le projet une fois → pnpm build (génère ./dist)
 *
 * On utilise le binaire vite local (node_modules/.bin/vite) pour ne pas
 * dépendre de pnpm dans le PATH du process PM2 systemd.
 *
 * Commandes utiles :
 *   pnpm build                         # à faire avant toute mise en prod
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'fanafodiko-frontend',

      // Binaire vite local — pas besoin de pnpm dans le PATH
      script: 'node_modules/.bin/vite',
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
