# Backlog Priorizado - Analise de Infraestrutura

## Objetivo

Organizar os gaps apontados em `docs/analise-infraestrutura.md` em uma fila executavel, priorizada por impacto operacional e dependencia tecnica.

## Ordem de Prioridade

### P0 - Controle de acesso e visibilidade operacional

1. `15.3` e `15.4` - Expiracao de acesso no backend e frontend
2. `21.1` - API de progresso detalhado por aluno
3. `21.2` - Tela de drill-down de progresso por aluno
4. Exportacao de relatorios em CSV/XLS

### P1 - Fluxo comercial

5. Sistema de cupons `17.1` a `17.4`
6. Associacao curso -> plano `16.1` a `16.4`
7. Upgrade/downgrade de plano `18.1` a `18.4`
8. Parcelamento e melhorias de checkout `20.1` a `20.4`
9. Periodo semestral `19.1` a `19.3`

### P2 - Operacao e usabilidade

10. Alerta de tarefa enviada
11. Busca e filtro na lista de alunos
12. Auto-resume de video `22.4`
13. Historico de tentativas do quiz para o aluno
14. Resultado inline de tarefa pratica
15. Busca no catalogo de cursos
16. Notificacao visual de matricula aprovada

### P3 - Robustez e observabilidade

17. Monitoramento de erros em producao
18. Rate limiting nas APIs criticas
19. Logs estruturados de eventos

## Itens Ja Executados

- `BUG-1` bypass silencioso de tentativas foi corrigido
- `BUG-2` fire-and-forget do progresso foi corrigido
- `15.4` expiração no frontend e `certificate_enabled` foram implementados
- Fluxo de prova final foi fechado
- Builder de certificados com assinatura foi implementado

## Itens Ja Especificados em Story

- `15.3` Expiracao de acesso no backend
- `15.4` Expiracao de acesso no frontend
- `16.1` a `16.4` Associacao curso/plano
- `17.1` a `17.4` Sistema de cupons
- `18.1` a `18.4` Upgrade/downgrade de plano
- `19.1` a `19.3` Periodo semestral
- `20.1` a `20.4` Precificacao e checkout
- `21.1` Progresso detalhado do aluno
- `21.2` Drill-down de progresso do aluno
- `22.4` Auto-resume de video

## Proximos Passos Recomendados

1. Implementar `21.1` e `21.2` para fechar a visibilidade do admin sobre progresso individual.
2. Desbloquear exportacao de relatorios.
3. Avancar para `17.x` ou `18.x` conforme prioridade comercial.
