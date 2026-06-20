# Recomendações — Tutor LMS para Plataforma EAD Fábio Borges

**Data:** 2026-06-18

## Observações Estratégicas

### 1. O Modelo de Add-ons é o Principal Risco

Funcionalidades críticas para um EAD de nível profissional requerem a versão Pro + add-ons específicos:

- Certificados → Add-on Certificate (Pro)
- Aulas ao vivo → Add-on Zoom ou Google Meet (Pro)
- Prévia gratuita de lições → Add-on Course Preview (Pro)
- Content drip → Add-on (Pro)
- Tarefas (assignments) → Add-on (Pro)

**Recomendação:** Mapear quais add-ons são necessários antes de iniciar o desenvolvimento para calcular o custo real do Tutor LMS Pro.

### 2. O Builder de Quiz é Forte — 8 Tipos é Diferencial Real

Para uma plataforma EAD com foco em cursos técnicos ou avaliações sérias, os 8 tipos de pergunta nativos (incluindo Image Answering, Matching, Ordering) são um diferencial concreto sobre LifterLMS e Sensei LMS.

### 3. AI Studio Pode Acelerar a Criação de Conteúdo Inicial

O AI Studio (GPT integration) é relevante se o criador precisar popular a plataforma rapidamente. Requer OpenAI Pro API key.

### 4. Frontend Dashboard é Crítico para Multi-Instructor

Se a plataforma EAD permitir que instrutores terceiros publiquem cursos, o Frontend Dashboard do Tutor LMS elimina a necessidade de dar acesso ao wp-admin.

### 5. Campos Que Precisam de Mapeamento para o Projeto

Os campos abaixo do Tutor LMS precisam ser espelhados no schema do banco de dados do projeto:

| Campo Tutor LMS          | Equivalente no Projeto            |
| ------------------------ | --------------------------------- |
| Course Title             | `courses.title`                   |
| Course Description       | `courses.description`             |
| Featured Image           | `courses.thumbnail_url`           |
| Intro Video              | `courses.intro_video_url`         |
| Categories               | `course_categories`               |
| Tags                     | `course_tags`                     |
| Difficulty Level         | `courses.difficulty_level`        |
| What Will I Learn        | `courses.learning_outcomes[]`     |
| Target Audience          | `courses.target_audience`         |
| Requirements             | `courses.requirements[]`          |
| Materials Included       | `courses.materials_included[]`    |
| Total Duration           | `courses.duration_minutes`        |
| Max Students             | `courses.max_students`            |
| Enrollment Expiration    | `courses.access_duration_days`    |
| Pricing Model            | `courses.is_free`                 |
| Regular Price            | `courses.price`                   |
| Sale Price               | `courses.sale_price`              |
| Topics                   | `course_modules`                  |
| Lessons                  | `lessons`                         |
| Quiz                     | `quizzes`                         |
| Quiz Questions (8 tipos) | `quiz_questions.type`             |
| Certificate Template     | `courses.certificate_template_id` |

## Próximas Etapas

- **@pm ou @po** — Priorizar quais features do Tutor LMS serão replicadas ou integradas na plataforma EAD
- **@architect** — Avaliar se o projeto integra o Tutor LMS como plugin ou replica o builder nativamente
- **@data-engineer** — Mapear schema do banco baseado na tabela de campos acima
- **@dev** — Implementar o Course Builder alinhado ao modelo de dados definido
