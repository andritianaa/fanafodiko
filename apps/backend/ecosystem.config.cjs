/**
 * PM2 — Backend Fanafodiko (runtime Bun)
 *
 * Linux : bun s'installe dans ~/.bun/bin — PM2 via systemd
 *   n'hérite pas du PATH utilisateur, donc on passe le chemin absolu.
 *
 * Windows : idem, bun est dans %USERPROFILE%\.bun\bin
 *
 * Commandes utiles :
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup   (puis copier-coller la commande affichée)
 */

const home = process.env.HOME || process.env.USERPROFILE || '/root';
const bunBin = `${home}/.bun/bin`;

module.exports = {
  apps: [
    {
      name: 'fanafodiko-backend',
      script: 'src/main.ts',

      // Chemin absolu vers bun — fonctionne même quand PM2 démarre via systemd
      interpreter: `${bunBin}/bun`,

      cwd: __dirname,

      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 2000,

      env: {
        NODE_ENV: 'production',
        PORT: 9991,
        HOST: '0.0.0.0',
        // S'assure que bun et ses dépendances sont trouvables
        PATH: `${bunBin}:${process.env.PATH || '/usr/local/bin:/usr/bin:/bin'}`,
      },

      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
