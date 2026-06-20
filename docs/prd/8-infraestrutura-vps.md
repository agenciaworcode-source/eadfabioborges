# 8. Infraestrutura VPS

**Por que VPS própria?** Controle total dos dados (LGPD), custo fixo (~R$80–150/mês), sem limitação de bandwidth para vídeos, sem cold starts.

## Especificação Recomendada

| Recurso  | Mínimo                          | Recomendado                     | Observação                                 |
| -------- | ------------------------------- | ------------------------------- | ------------------------------------------ |
| vCPU     | 2 cores                         | 4 cores                         | PM2 cluster aproveita múltiplos cores      |
| RAM      | 4 GB                            | 8 GB                            | Next.js build consome ~1.5 GB              |
| Storage  | 40 GB SSD                       | 80 GB NVMe                      | Uploads via Supabase Storage (fora da VPS) |
| Sistema  | Ubuntu 24.04 LTS                | Ubuntu 24.04 LTS                | Suporte até 2029                           |
| Provedor | Hostinger VPS / Hetzner / Vultr | Hostinger VPS / Hetzner / Vultr | R$80–150/mês                               |

## Serviços na VPS

| Serviço       | Tecnologia     | Detalhes                                             |
| ------------- | -------------- | ---------------------------------------------------- |
| Processo Node | PM2            | Cluster mode, auto-restart, logs centralizados       |
| Reverse Proxy | Nginx          | SSL termination, gzip, rate limiting, cache estático |
| SSL/TLS       | Let's Encrypt  | Certbot com auto-renewal. HTTPS obrigatório.         |
| Firewall      | UFW + Fail2ban | Portas 22, 80, 443 abertas. Resto bloqueado.         |
| Backup        | Restic + S3    | Backup diário automático. Retenção 30 dias.          |
| Monitor       | UptimeRobot    | Ping a cada 5min. Alerta WhatsApp se cair.           |

## Ambientes

| Ambiente        | URL                               | Config                                                      |
| --------------- | --------------------------------- | ----------------------------------------------------------- |
| Desenvolvimento | Local                             | Next.js dev · Supabase local (Docker) · Stripe CLI webhooks |
| Homologação     | staging.fabioborgesoficial.com.br | Stripe test mode                                            |
| Produção        | ead.fabioborgesoficial.com.br     | Stripe live mode                                            |

## Pipeline CI/CD (GitHub Actions)

1. Push para `main` no GitHub → Actions dispara o workflow automaticamente
2. CI: `npm run lint && tsc --noEmit && npm run build`
3. SSH para VPS → git pull → npm ci → build (deploy incremental sem downtime)
4. `pm2 reload ead --update-env` — zero-downtime restart
5. Health check + notificação: curl em `/api/health`. Alerta no Slack se falhar.

---
