# 14. Deploy e CI/CD

## 14.1 Pipeline GitHub Actions

```yaml
# .github/workflows/deploy.yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build

  deploy:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/ead-fabioborges
            git pull origin main
            npm ci --production=false
            npm run build
            pm2 reload ead --update-env
            curl -f http://localhost:3000/api/health || exit 1
```

## 14.2 Ambientes

| Ambiente        | URL                               | Branch  | Stripe          | Supabase                |
| --------------- | --------------------------------- | ------- | --------------- | ----------------------- |
| Desenvolvimento | localhost:3000                    | feat/\* | Test mode + CLI | Local Docker            |
| Homologação     | staging.fabioborgesoficial.com.br | staging | Test mode       | Cloud (staging project) |
| Produção        | ead.fabioborgesoficial.com.br     | main    | Live mode       | Cloud (prod project)    |

## 14.3 PM2 Ecosystem

```javascript
// pm2.ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ead',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 'max', // cluster mode — usa todos os vCPUs
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_file: '/var/log/pm2/ead.log',
      error_file: '/var/log/pm2/ead-error.log',
      max_memory_restart: '1G',
    },
  ],
}
```

---
