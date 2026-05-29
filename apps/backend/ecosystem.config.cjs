/**
 * PM2 — Backend Fanafodiko (runtime Bun)
 *
 * On utilise un script shell wrapper (start.sh) pour éviter que PM2
 * utilise son ProcessContainerForkBun interne qui tente un require()
 * incompatible avec les modules ES / top-level await de main.ts.
 *
 * Sur le serveur, créer start.sh une fois :
 *   cat > start.sh << 'EOF'
 *   #!/bin/bash
 *   export PATH="$HOME/.bun/bin:$PATH"
 *   exec bun src/main.ts
 *   EOF
 *   chmod +x start.sh
 */

module.exports = {
  apps: [
    {
      name: 'fanafodiko-backend',
      script: './start.sh',
      interpreter: '/bin/bash',
      cwd: __dirname,

      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 2000,

      env: {
        NODE_ENV: 'production',
        PORT: 9991,
        HOST: '0.0.0.0',
      },

      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
