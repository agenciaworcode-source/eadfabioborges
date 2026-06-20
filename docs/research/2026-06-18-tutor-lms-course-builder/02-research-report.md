# Relatório de Pesquisa: Tutor LMS — Fluxo Completo de Criação de Cursos

**Data:** 2026-06-18
**Versão de referência:** Tutor LMS v3.x (Pro)
**Fontes:** Documentação oficial (docs.themeum.com), páginas de features (tutorlms.com)

---

## 1. TELA DE CRIAÇÃO DE CURSO — ABA "BASIC"

O Tutor LMS organiza a criação de curso em **3 abas principais** dentro do wp-admin: **Basic**, **Curriculum** e **Additional Settings**. A aba Basic concentra os metadados e configurações principais.

### 1.1 Campos de Conteúdo Principal

| Campo                  | Tipo                   | Descrição                                                           |
| ---------------------- | ---------------------- | ------------------------------------------------------------------- |
| **Course Title**       | Texto obrigatório      | Nome do curso — deve ser claro e refletir o conteúdo                |
| **Course URL**         | Slug editável          | Gerado automaticamente a partir do título, mas editável manualmente |
| **Course Description** | Rich text editor       | Editor visual completo com formatação, imagens e links              |
| **Featured Image**     | Upload de imagem       | Thumbnail do curso para listagens e compartilhamento social         |
| **Intro Video**        | Upload MP4/WebM ou URL | Vídeo de introdução do curso; aceita upload direto ou URL externa   |

### 1.2 Taxonomias e Metadados

| Campo           | Tipo                            | Descrição                                                            |
| --------------- | ------------------------------- | -------------------------------------------------------------------- |
| **Categories**  | Seleção múltipla com hierarquia | Categorias do curso; suporta múltiplas e hierarquia de subcategorias |
| **Tags**        | Tags livres                     | Labels de palavras-chave para descoberta e SEO                       |
| **Author**      | Seleção de usuário              | Instrutor principal selecionado entre usuários registrados           |
| **Instructors** | Seleção múltipla                | Múltiplos instrutores por curso _(requer add-on Multi-Instructors)_  |

### 1.3 Configurações de Matrícula e Acesso

| Campo                        | Tipo             | Opções / Descrição                                    |
| ---------------------------- | ---------------- | ----------------------------------------------------- |
| **Maximum Students**         | Número inteiro   | Limite de matrículas; `0` = ilimitado                 |
| **Difficulty Level**         | Dropdown         | All Levels / Beginner / Intermediate / Expert         |
| **Public Course**            | Toggle (boolean) | Torna o conteúdo acessível sem login/conta            |
| **Course Visibility**        | Dropdown         | Public / Password Protected / Private                 |
| **Enrollment Expiration**    | Número (dias)    | Dias de acesso após matrícula; `0` = acesso vitalício |
| **Course Enrollment Period** | Date range       | Data de início e fim do período de matrículas         |
| **Pause Enrollment**         | Toggle           | Para temporariamente novas matrículas                 |
| **Schedule**                 | Date/time picker | Agendamento de data futura de publicação              |

### 1.4 Monetização (dentro da aba Basic)

| Campo             | Tipo               | Descrição                               |
| ----------------- | ------------------ | --------------------------------------- |
| **Pricing Model** | Radio: Free / Paid | Define se o curso é gratuito ou pago    |
| **Regular Price** | Valor monetário    | Preço base do curso _(quando Paid)_     |
| **Sale Price**    | Valor monetário    | Preço com desconto _(opcional)_         |
| **Subscription**  | Seleção            | Vincula o curso a pacotes de assinatura |

### 1.5 Conteúdo de Aprendizagem (aba "Additional Settings")

Estes campos aparecem em uma aba separada dentro do Course Builder:

| Campo                           | Tipo                   | Descrição                                                             |
| ------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| **What Will I Learn?**          | Lista de bullet points | Resultados de aprendizado e principais benefícios                     |
| **Target Audience**             | Texto livre            | Público-alvo do curso                                                 |
| **Total Course Duration**       | Horas + minutos        | Estimativa de tempo total de conclusão                                |
| **Materials Included**          | Texto livre            | Recursos extras incluídos (templates, acesso a comunidades, etc.)     |
| **Requirements / Instructions** | Texto livre            | Pré-requisitos de software, leitura recomendada, instruções especiais |

### 1.6 Add-ons na Aba Additional Settings

| Campo                    | Requisito                    | Descrição                                                                         |
| ------------------------ | ---------------------------- | --------------------------------------------------------------------------------- |
| **Course Prerequisites** | Add-on: Course Prerequisites | Exige conclusão de outros cursos antes de iniciar este                            |
| **Attachments**          | Add-on: Course Attachments   | Upload de arquivos suplementares (PDFs, docs, áudio, vídeo, arquivos)             |
| **Schedule Live Class**  | Add-on: Zoom ou Google Meet  | Agenda aulas ao vivo vinculadas ao curso                                          |
| **Certificate**          | Add-on: Certificate          | Seleciona template ou cria certificado customizado; layout: Landscape ou Portrait |
| **Content Drip**         | Add-on: Content Drip         | Aparece como aba extra em "Basics" — 4 tipos de liberação programada              |

---

## 2. BUILDER DE CURRÍCULO — ABA "CURRICULUM"

### 2.1 Hierarquia de 3 Camadas

```
Curso
  └── Topic (Módulo/Capítulo)
        ├── Lesson (Aula)
        ├── Quiz (Avaliação)
        └── Assignment (Tarefa)
```

Os **Topics** funcionam como containers/capítulos que agrupam todo o conteúdo relacionado. A documentação descreve: _"Topics act as containers for grouping related lessons and quizzes. Think of them as the chapters or modules of your course."_

### 2.2 Criação de Tópicos (Módulos)

- Botão **"+ Add Topic"** no rodapé da seção de Curriculum
- Campos ao criar um tópico:
  - **Title** — nome descritivo do módulo (obrigatório)
  - **Summary** — descrição contextual opcional
- Clicar em **"Ok"** salva o tópico, que aparece imediatamente na hierarquia

### 2.3 Drag-and-Drop de Tópicos

- Reordenação via **drag-and-drop nativo**: clicar e segurar o título do tópico, arrastar para a posição desejada
- O mesmo mecanismo funciona para reordenar lições dentro de cada tópico

### 2.4 Adicionando Conteúdo Dentro de Tópicos

Dentro de cada tópico, aparecem botões inline:

| Botão            | Ação                           | Requisito           |
| ---------------- | ------------------------------ | ------------------- |
| **+ Lesson**     | Abre popup de criação de lição | Nativo              |
| **+ Quiz**       | Abre Quiz Builder              | Nativo              |
| **+ Assignment** | Adiciona tarefa ao tópico      | Add-on: Assignments |

### 2.5 Interface Visual

O Curriculum section fornece uma **visão geral visual da estrutura** completa do curso em forma de lista hierárquica com indentação, permitindo ao instrutor ver e reorganizar todos os tópicos e lições em uma única tela.

---

## 3. CONFIGURAÇÃO DE LIÇÃO/AULA

### 3.1 Criação de Lição

Ao clicar em **+ Lesson** dentro de um tópico, abre um popup/drawer com os seguintes campos:

| Campo              | Tipo              | Descrição                                                            |
| ------------------ | ----------------- | -------------------------------------------------------------------- |
| **Lesson Name**    | Texto obrigatório | Título da lição (deve identificar claramente o conteúdo)             |
| **Content**        | Rich text editor  | Editor avançado com formatação completa para aulas baseadas em texto |
| **Featured Image** | Upload de imagem  | Thumbnail visual da lição para catálogo do curso                     |

### 3.2 Configuração de Vídeo

| Campo                          | Tipo             | Opções                                                                      |
| ------------------------------ | ---------------- | --------------------------------------------------------------------------- |
| **Video**                      | Upload ou embed  | Upload direto de MP4 / Embed por URL                                        |
| **Fontes de vídeo suportadas** | —                | YouTube, Vimeo, upload self-hosted (MP4)                                    |
| **Custom Video Thumbnail**     | Upload de imagem | Thumbnail customizado para o player do vídeo                                |
| **Video Playback Time**        | Número manual    | Duração manualmente especificada para exibição (independente do vídeo real) |

**Auto-Resume:** vídeos retomam de onde o aluno parou na última sessão.

**Completion Requirement:** instrutores podem configurar critério de conclusão de vídeo (ex.: assistir X% para marcar como completo).

### 3.3 Tipos de Aula / Conteúdo

| Tipo                         | Nativo/Add-on              | Descrição                                      |
| ---------------------------- | -------------------------- | ---------------------------------------------- |
| **Texto/Rich Text**          | Nativo                     | Editor avançado com imagens, links, formatação |
| **Vídeo (YouTube)**          | Nativo                     | Embed por URL do YouTube                       |
| **Vídeo (Vimeo)**            | Nativo                     | Embed por URL do Vimeo                         |
| **Vídeo (Self-hosted)**      | Nativo                     | Upload direto de MP4/WebM                      |
| **Quiz**                     | Nativo                     | Avaliação com 8 tipos de pergunta              |
| **Assignment**               | Add-on: Assignments        | Tarefa com upload de arquivo pelo aluno        |
| **Live Class (Zoom)**        | Add-on: Zoom               | Videoconferência via Zoom integrada ao tópico  |
| **Live Class (Google Meet)** | Add-on: Google Meet        | Reunião via Google Meet vinculada ao currículo |
| **Arquivo para download**    | Add-on: Course Attachments | PDFs, documentos, áudio, vídeo para download   |
| **H5P Interactive**          | Add-on: H5P                | Conteúdo interativo H5P dentro de lições       |

### 3.4 Preview Gratuito (Course Preview Add-on)

- Ativado via toggle **"Lesson Preview"** no sidebar direito de cada lição
- Alunos não matriculados veem **ícone de olho** nas lições liberadas para preview
- Lições bloqueadas exibem **ícone de cadeado**
- O aluno acessa a lição de preview como se fosse aluno matriculado (experiência completa)
- Indicado para as **primeiras lições** de cada curso como estratégia de marketing

### 3.5 Aulas ao Vivo — Zoom

Campos ao criar uma meeting Zoom dentro do curso:

| Campo                  | Descrição                    |
| ---------------------- | ---------------------------- |
| Meeting Name & Summary | Título e descrição da sessão |
| Date, Time & Duration  | Agendamento da aula          |
| Time Zone              | Fuso horário                 |
| Auto Recording         | Local / Cloud / Sem gravação |
| Meeting Password       | Senha de acesso à reunião    |
| Host                   | Exibido automaticamente      |

### 3.6 Aulas ao Vivo — Google Meet

Campos de configuração global:

- Default Timezone
- Default Reminder Time (notificação por email)
- Default Event Status
- Send Updates preferences
- Visibility (pública/privada)

Criação de meeting diretamente como item no currículo (dentro de tópico) ou no nível do curso.

---

## 4. CONFIGURAÇÃO DE QUIZ

### 4.1 Criação do Quiz

O botão **+ Quiz** dentro de um tópico abre o **Quiz Builder**, que exige:

- **Título** do quiz
- **Descrição** do quiz

Em seguida, o instrutor adiciona perguntas uma a uma.

### 4.2 Oito Tipos de Pergunta

#### 1. True/False

- Pergunta com duas opções: True ou False
- Campos: título, randomize choice (embaralha a ordem das opções), resposta correta marcada
- Extras: answer explanation, answer required toggle, pontos por questão

#### 2. Multiple Choice

- Apresenta múltiplas opções de resposta
- Suporta **resposta única ou múltiplas respostas corretas** (via toggle)
- Permite incluir imagens nas opções (recomendado: 700×430px)
- "+ Add Option" para adicionar alternativas ilimitadas

#### 3. Open Ended / Essay

- Resposta dissertativa de texto longo
- Limite de caracteres configurável nas Quiz Settings
- Ideal para avaliação subjetiva/crítica

#### 4. Fill in the Blanks

- Usa a variável `{dash}` para marcar os espaços em branco no texto
- Múltiplas respostas aceitas separadas por `|` (pipe)
- Exemplo: "Water is made of {dash} and {dash}" → respostas: "Hydrogen | Oxygen"
- Seção de answer explanation opcional

#### 5. Short Answer

- Resposta curta de texto
- Limite de caracteres configurável nas Quiz Settings (padrão: 200)

#### 6. Matching

- Alunos emparelham itens de duas listas
- Toggle **Image Matching** para usar imagens em vez de texto nas colunas
- "+ Add Option" para adicionar pares

#### 7. Image Answering

- Alunos selecionam a imagem correta como resposta
- Upload de imagens (recomendado: 700×430px)
- Adiciona descrição/label para cada imagem

#### 8. Ordering

- Alunos reordenam itens (texto, imagens, ou ambos) na sequência correta
- Avalia raciocínio sequencial e organização lógica

### 4.3 Configurações por Questão

Disponíveis em todos os tipos de pergunta:

- **Answer Required** — toggle para tornar a resposta obrigatória
- **Points** — valor em pontos para a questão
- **Display Points** — exibir ou ocultar a pontuação da questão para o aluno
- **Answer Explanation** — texto explicativo exibido após a resposta

### 4.4 Quiz Settings — Configurações do Quiz Completo

#### Settings Básicas

| Configuração              | Tipo                | Descrição                                                                |
| ------------------------- | ------------------- | ------------------------------------------------------------------------ |
| **Time Limit**            | Número + unidade    | Unidades: segundos, minutos, horas, dias, semanas. `0` = sem limite      |
| **Hide Quiz Time**        | Toggle              | Oculta o timer do aluno durante o quiz                                   |
| **Feedback Mode**         | Dropdown (3 opções) | Ver abaixo                                                               |
| **Attempts Allowed**      | Número              | Máximo de tentativas (padrão: 10). `0` = ilimitado                       |
| **Passing Grade**         | Porcentagem         | Nota mínima para aprovação (apenas em %)                                 |
| **Max Questions Allowed** | Número              | Se definido, seleciona N perguntas aleatórias do pool total              |
| **Prerequisites**         | Seleção de conteúdo | Requer conclusão de lições/quizzes anteriores antes de liberar este quiz |

**Feedback Mode — 3 opções:**

1. **Default** — respostas exibidas após concluir o quiz inteiro
2. **Reveal Mode** — respostas exibidas após cada tentativa
3. **Retry Mode** — permite refazer o quiz quantas vezes quiser (sem limite)

#### Settings Avançadas

| Configuração                     | Descrição                                          |
| -------------------------------- | -------------------------------------------------- |
| **Quiz Auto Start**              | Inicia o quiz automaticamente ao carregar a página |
| **Question Layout**              | Single Question / Pagination / Sequential          |
| **Hide Question Number**         | Oculta a numeração das questões durante o quiz     |
| **Short Answer Character Limit** | Padrão: 200 caracteres                             |
| **Essay Character Limit**        | Padrão: 500 caracteres                             |

#### Randomização de Questões

- Quando **Max Questions Allowed** é definido (ex.: 10 de um pool de 50), cada aluno recebe um conjunto único e aleatório de perguntas — previne cola.

---

## 5. CONFIGURAÇÕES DO CURSO

### 5.1 Controles de Acesso e Visibilidade

| Configuração          | Opções                                | Descrição                                      |
| --------------------- | ------------------------------------- | ---------------------------------------------- |
| **Course Visibility** | Public / Password Protected / Private | Controla quem pode ver o curso                 |
| **Public Course**     | Toggle                                | Conteúdo acessível sem criar conta             |
| **Pause Enrollment**  | Toggle                                | Pausa novas matrículas sem despublicar o curso |

### 5.2 Monetização e Preço

| Configuração            | Opções / Descrição                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Pricing Model**       | Free / Paid                                                                                                              |
| **Regular Price**       | Valor base do curso                                                                                                      |
| **Sale Price**          | Preço promocional (opcional)                                                                                             |
| **Subscription**        | Vincula o curso a planos de assinatura                                                                                   |
| **Gateways suportados** | PayPal, Stripe, Paddle, Authorize.net e outros                                                                           |
| **eCommerce Engines**   | Native Tutor, WooCommerce, WooCommerce Subscriptions, Easy Digital Downloads, Paid Memberships Pro, Restrict Content Pro |

Apenas **um engine de monetização** pode estar ativo por vez.

### 5.3 Prazo e Controle de Matrículas

| Configuração                 | Descrição                                     |
| ---------------------------- | --------------------------------------------- |
| **Maximum Students**         | Limite de alunos matriculados (0 = ilimitado) |
| **Enrollment Expiration**    | Dias de acesso após matrícula (0 = vitalício) |
| **Course Enrollment Period** | Data de início e fim do período de matrículas |
| **Schedule**                 | Agendamento de data de publicação do curso    |

### 5.4 Certificado (Add-on)

- Seleção de **template pré-construído** ou criação via **Certificate Builder** (drag-and-drop)
- Campos do certificado:
  - Nome do emissor (Authorized Name)
  - Nome da empresa (Authorized Company Name)
  - Exibir nome do instrutor (toggle)
  - Upload de assinatura
  - Link do certificado em emails de conclusão
- **Layouts:** Landscape ou Portrait
- **Formatos de download:** PDF ou JPG
- **Trigger:** aparece como "View Certificate" após o aluno concluir todo o conteúdo
- **Desativar:** selecionar "None" no campo de Certificate Template do curso

### 5.5 Content Drip (Add-on) — 4 Modos

| Modo                      | Descrição                                                 |
| ------------------------- | --------------------------------------------------------- |
| **Schedule by Date**      | Define data específica para cada lição/quiz/assignment    |
| **Days After Enrollment** | Libera conteúdo X dias após a matrícula do aluno          |
| **Sequential Unlock**     | Próxima lição só libera após concluir a anterior          |
| **Prerequisites-Based**   | Aluno precisa completar itens designados antes de avançar |

### 5.6 Pré-requisitos de Curso (Add-on)

- Pesquisa e seleção de cursos que o aluno deve ter concluído antes de se matricular neste

### 5.7 Dificuldade do Curso

| Opção        |
| ------------ |
| All Levels   |
| Beginner     |
| Intermediate |
| Expert       |

---

## 6. DIFERENCIAL DO TUTOR LMS EM UX DO BUILDER

### 6.1 Course Builder Integrado ao wp-admin (não iframe externo)

O builder do Tutor LMS roda nativamente no WordPress admin, sem redirecionar para um app separado. Isso mantém o instrutor no contexto familiar do WordPress e evita problemas de autenticação.

### 6.2 Estrutura em Abas — Sem Scrollagem Infinita

A organização em **3 abas distintas** (Basic, Curriculum, Additional Settings) evita páginas infinitamente longas. Cada aba tem um propósito claro:

- Basic: identidade e metadados do curso
- Curriculum: conteúdo e estrutura
- Additional Settings: informações pedagógicas e add-ons

### 6.3 Drag-and-Drop de Tópicos E Lições

Reordenação visual nativa — sem necessidade de digitar números de ordem ou usar menus contextuais complexos.

### 6.4 Add-ons Granulares (Pay-for-What-You-Need)

O modelo de 21 add-ons premium permite ativar exatamente as features necessárias, sem bloat. Cada add-on ativa campos específicos no builder (ex.: o Certificate add-on adiciona o campo de template; o Zoom add-on adiciona o campo de Live Class).

### 6.5 Quiz Builder com 8 Tipos de Pergunta

Comparado a outros LMS WordPress:

- **LearnDash:** quiz integrado mas com tipos mais limitados no builder padrão
- **LifterLMS:** quiz funcional mas UX mais complexa
- **Tutor LMS:** 8 tipos nativos incluindo Image Answering e Ordering, com pool de questões e randomização

### 6.6 AI Studio (GPT Integration)

Único entre os principais LMS WordPress a ter **geração de curso completo por IA** nativa (via OpenAI API), gerando: título, outline, lições, quizzes e imagem destacada com um clique.

### 6.7 Preview de Lição Individual

O toggle de preview por lição (não apenas por curso) é mais granular que a maioria dos concorrentes, permitindo estratégias de marketing muito específicas.

### 6.8 Auto-Resume de Vídeo

Retomada automática de onde o aluno parou — feature presente mas não universal em outros LMS WordPress.

### 6.9 Gamificação Integrada

Points, badges e leaderboards como features nativas (não apenas via integração com plugin externo).

### 6.10 Frontend Dashboard Limpo

Instrutores podem criar e gerenciar cursos via **Frontend Dashboard** (sem acessar o wp-admin), com a mesma funcionalidade completa — diferencial importante para plataformas marketplace com múltiplos instrutores.

---

## 7. RESUMO DE ADD-ONS RELEVANTES PARA CRIAÇÃO DE CURSOS

| Add-on                   | Funcionalidade Desbloqueada                         |
| ------------------------ | --------------------------------------------------- |
| **Certificate**          | Templates e builder de certificados                 |
| **Content Drip**         | 4 modos de liberação programada                     |
| **Course Preview**       | Preview de lições individuais para não-matriculados |
| **Course Attachments**   | Arquivos para download nas lições                   |
| **Course Prerequisites** | Cursos pré-requisito                                |
| **Assignments**          | Tarefas com upload de arquivo                       |
| **Zoom**                 | Aulas ao vivo via Zoom                              |
| **Google Meet**          | Aulas ao vivo via Google Meet                       |
| **Multi Instructors**    | Múltiplos instrutores por curso                     |
| **H5P**                  | Conteúdo interativo H5P                             |
| **Quiz Export/Import**   | Portabilidade de quizzes                            |
| **Gradebook**            | Gestão de notas centralizada                        |
| **Reports**              | Analytics de progresso dos alunos                   |
| **WPML**                 | Suporte a múltiplos idiomas                         |

---

## 8. FLUXO COMPLETO DE CRIAÇÃO — PASSO A PASSO

```
1. wp-admin > Tutor LMS > Courses > Add New
   └── Abre o Course Builder

2. ABA BASIC
   ├── Preencher: Title, Description, Featured Image
   ├── Definir: Category, Tags, Author
   ├── Configurar: Pricing (Free/Paid), Visibility, Max Students
   ├── Configurar: Enrollment Period, Expiration
   └── Adicionar: Intro Video (opcional)

3. ABA CURRICULUM
   ├── + Add Topic → preencher Title + Summary
   │   ├── + Lesson → configurar conteúdo, vídeo, preview toggle
   │   ├── + Quiz → Quiz Builder com 8 tipos de pergunta
   │   │   └── Quiz Settings: time limit, attempts, passing grade, feedback mode
   │   └── + Assignment → título, pontos, prazo (add-on)
   └── Drag-and-drop para reordenar topics e lessons

4. ABA ADDITIONAL SETTINGS
   ├── What Will I Learn? (bullets)
   ├── Target Audience
   ├── Total Duration
   ├── Materials Included
   ├── Requirements/Instructions
   ├── Prerequisites (add-on)
   ├── Attachments (add-on)
   ├── Schedule Live Class - Zoom/Google Meet (add-on)
   └── Certificate template (add-on)

5. PUBLISH → Course live
```
