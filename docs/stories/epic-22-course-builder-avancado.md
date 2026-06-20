# Epic 22 — Course Builder Avançado (Tutor LMS Parity)

## Status: Draft

## Objetivo

Replicar o fluxo completo de criação e edição de cursos do **Tutor LMS**, transformando o atual builder simples em uma interface profissional com layout de 3 abas, drag-and-drop, rich text, suporte a YouTube, quiz avançado com 5 tipos de questão, timer e randomização.

## Motivação

O admin atual tem todas as opções em uma única aba com scroll infinito, reordenação por botões ↑↓, textarea puro para aulas de texto e quiz limitado a 3 tipos de pergunta. O Tutor LMS organiza tudo em 3 abas distintas (Básico / Currículo / Configurações), drag-and-drop nativo, rich text editor e 8 tipos de questão. Esta paridade eleva a experiência de criação de conteúdo para o nível profissional que o Fábio Borges precisa para escalar a plataforma.

## Referência

Gap Analysis completo realizado em 2026-06-18 comparando a implementação atual vs Tutor LMS.

## Stories

| Story | Título                                                          | Tipo       | Dep.    |
| ----- | --------------------------------------------------------------- | ---------- | ------- |
| 22.1  | Migration — Schema Course Builder Avançado                      | Database   | Nenhuma |
| 22.2  | Course Builder UI — Layout 3 Abas + Campos Avançados            | Frontend   | 22.1    |
| 22.3  | Curriculum Builder — Drag-and-Drop + Rich Text + Sumário        | Frontend   | 22.1    |
| 22.4  | Vídeo Avançado — YouTube + Thumbnail + Completion + Auto-Resume | Full-stack | 22.1    |
| 22.5  | Quiz Avançado — 5 Tipos + Timer + Feedback Mode + Randomização  | Full-stack | 22.1    |

## Dependências em Cadeia

```
22.1 → 22.2 (paralelo) → Done
22.1 → 22.3 (paralelo) → Done
22.1 → 22.4 (paralelo) → Done
22.1 → 22.5 (paralelo) → Done
```

Após 22.1 concluída, as demais 4 stories podem correr em paralelo.

## Tabelas Afetadas

- `courses` — 7 novos campos
- `modules` — 1 novo campo
- `lessons` — 3 novos campos
- `quizzes` — 4 novos campos
- `questions` — novos valores no enum de tipo

## Scope OUT (Epic 22)

- Content Drip (liberação por data/dias/sequencial) — Epic futuro
- Certificado builder visual (drag-and-drop) — Epic futuro
- Múltiplos instrutores — fora do escopo da plataforma
- Gamificação (pontos, badges, leaderboard) — Epic futuro
- Live class (Zoom/Google Meet) — Epic futuro

## Complexidade Geral

**Large** — 5 stories cobrindo DB, UI, drag-and-drop, rich text editor, integração YouTube e quiz avançado.
