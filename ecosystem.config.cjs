module.exports = {
  apps: [
    {
      name: 'cornus-app',
      script: 'npm',
      args: 'run start',
      cwd: '/var/www/cornusnew',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/var/log/cornus-app.log',
      out_file: '/var/log/cornus-app.out.log',
      error_file: '/var/log/cornus-app.err.log',
    },
  ],
};
