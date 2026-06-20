# 19. Monitoramento e Observabilidade

- **UptimeRobot:** Ping a cada 5min em `/api/health` → alerta WhatsApp se cair
- **PM2 Logs:** `pm2 logs ead` → logs centralizados em `/var/log/pm2/`
- **Nginx Access Log:** Auditoria de requests, detecção de ataques
- **Supabase Dashboard:** Queries lentas, uso de storage, auth logs
- **Sentry (Fase 2):** Error tracking client + server (pós-MVP)

**Métricas de negócio a monitorar:**

- Taxa de conversão por curso (pageview → checkout → enrollment)
- Taxa de conclusão por curso
- Webhook failures (Stripe dashboard)
- Alunos inativos (cron job de lembrete)

---
