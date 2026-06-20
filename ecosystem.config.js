module.exports = {
  apps: [
    {
      name: 'ead',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
