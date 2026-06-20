# 10. Riscos & Mitigações

| Risco                                       | Probabilidade | Impacto | Mitigação                                                                                                          |
| ------------------------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| Webhook Stripe não processar (timeout/erro) | Média         | Alto    | Idempotência por `stripe_event_id`. Retry automático do Stripe por 72h. Painel manual de fallback.                 |
| Vimeo bloquear embed fora do domínio        | Baixa         | Alto    | Configurar domínios permitidos no Vimeo Pro. Testar no staging antes do go-live.                                   |
| Emails caindo em spam                       | Média         | Médio   | Resend com SPF, DKIM e DMARC. Domínio próprio de envio. Testar com mail-tester.com.                                |
| VPS offline no dia do lançamento            | Baixa         | Alto    | UptimeRobot 5min. PM2 auto-restart. Backup snapshot da VPS. Plano B: Vercel temporário.                            |
| Geração de PDF falhar no certificado        | Baixa         | Médio   | Geração assíncrona em fila — não bloqueia conclusão do curso. Re-tentativa automática + alerta admin.              |
| Supabase free tier atingir limites          | Média         | Médio   | Monitorar mensalmente. Com <200 alunos o free é suficiente. Upgrade Pro (~US$25/mês) se necessário.                |
| Atraso de escopo em alguma sprint           | Média         | Médio   | Sprint 7 tem 4h de buffer. Features pós-lançamento (gamificação, analytics avançado) cortáveis sem impacto no MVP. |
