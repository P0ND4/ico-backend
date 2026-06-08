# Backend Implementation Plan — ico-backend

Updated: 2026-06-04
AI provider: DeepSeek (OpenAI-compatible API)
File storage: in-memory only (no persistence of uploaded files)

---

## New dependencies

```bash
pnpm add openai pdf-parse mammoth pdfkit
pnpm add -D @types/pdf-parse @types/pdfkit @types/mammoth
```

| Package | Purpose |
|---|---|
| `openai` | DeepSeek API (OpenAI-compatible, set `baseURL` to DeepSeek endpoint) |
| `pdf-parse` | Extract text from uploaded PDF files |
| `mammoth` | Extract text from uploaded DOCX files |
| `pdfkit` | Generate PDF exports (tutor conversation, summaries) |

---

## Architecture notes

**Entity placement**: TypeORM entities for new contexts go in `shared/domain/entities/{context}/` (existing convention). Repository interfaces go in each context's `domain/ports/`. TypeORM implementations go in each context's `infrastructure/repositories/`. Each context module registers its own entities via `TypeOrmModule.forFeature([...])`.

**Repository tokens**: Each context defines its own DI token constants in `infrastructure/constants/`. No cross-context token pollution.

**DeepSeek client**: Shared singleton in `shared/infrastructure/services/deepseek.service.ts`, injected via port interface. Contexts depend on the port, not the concrete service.

**All new contexts follow this folder pattern**:
```
src/contexts/{name}/
  domain/
    contracts/          # use case interfaces consumed by controllers
    ports/              # repository + service interfaces
    errors/             # domain errors
  application/
    use-cases/
  infrastructure/
    constants/          # DI tokens
    repositories/       # TypeORM implementations
    services/           # external service implementations
    http-api/v1/{feature}/
      controllers/
      requests/
      responses/
      {feature}.module.ts
  main.module.ts        # assembles all feature modules
```

---

## Slice 0 — Install dependencies (prerequisite for all slices)

```bash
cd ico-backend
pnpm add openai pdf-parse mammoth pdfkit
pnpm add -D @types/pdf-parse @types/pdfkit @types/mammoth
```

Add to `.env.example`:
```
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

---

## Slice 1 — User context cleanup

Remove all email/password auth. Retain: Google, Apple, Refresh, Logout.

### Files to DELETE
```
src/contexts/user/domain/dtos/register.dto.ts
src/contexts/user/domain/dtos/login.dto.ts
src/contexts/user/domain/dtos/verify-email.dto.ts
src/contexts/user/domain/dtos/resend-code.dto.ts
src/contexts/user/domain/ports/mail.port.ts
src/contexts/user/domain/ports/password.port.ts
src/contexts/user/domain/ports/verification-code.port.ts
src/contexts/user/domain/errors/auth/invalid-credentials.error.ts
src/contexts/user/domain/errors/auth/invalid-or-expired-code.error.ts
src/contexts/user/domain/errors/auth/no-pending-registration.error.ts
src/contexts/user/domain/errors/auth/user-already-exists.error.ts
src/contexts/user/domain/errors/auth/user-inactive.error.ts
src/contexts/user/infrastructure/services/mail.service.ts
src/contexts/user/infrastructure/services/password.service.ts
src/contexts/user/infrastructure/services/verification-code.service.ts
src/contexts/user/infrastructure/http-api/v1/auth/requests/register.request.ts
src/contexts/user/infrastructure/http-api/v1/auth/requests/login.request.ts
src/contexts/user/infrastructure/http-api/v1/auth/requests/verify-email.request.ts
src/contexts/user/infrastructure/http-api/v1/auth/requests/resend-code.request.ts
src/config/mail.config.ts
src/templates/                          # all Handlebars mail templates
```

### Files to MODIFY
```
src/contexts/user/application/use-cases/auth.use-case.ts
  → remove: register, login, verifyEmail, resendCode methods
  → keep: loginWithGoogle, loginWithApple, refresh, logout

src/contexts/user/domain/contracts/i-auth.use-case.ts
  → remove corresponding interface methods

src/contexts/user/domain/errors/auth/index.ts
  → remove deleted error exports

src/contexts/user/infrastructure/http-api/v1/auth/controllers/auth.controller.ts
  → remove: register, verifyEmail, resendCode, login endpoints
  → keep: google, apple, refresh, logout

src/contexts/user/infrastructure/http-api/v1/auth/auth.module.ts
  → remove: mail, password, verification-code service providers
  → remove: MailerModule import

src/app/app.module.ts
  → remove: MailerModule / mail.config
```

---

## Slice 2 — Shared TypeORM entities

Create all TypeORM entities for new bounded contexts in `shared/domain/entities/`.

### Files to CREATE

**Catalog entities** (`shared/domain/entities/catalog/`):
```
tag.entity.ts                 # cat.tags
path-mode.entity.ts           # cat.path_modes
path-status.entity.ts         # cat.path_statuses
job-status.entity.ts          # cat.job_statuses
chapter-status.entity.ts      # cat.chapter_statuses
lesson-type.entity.ts         # cat.lesson_types
message-role.entity.ts        # cat.message_roles
source-type.entity.ts         # cat.source_types
```

**Learning entities** (`shared/domain/entities/learning/`):
```
learning-path.entity.ts       # trn.learning_paths
path-tag.entity.ts            # trn.path_tags (junction)
path-generation-job.entity.ts # trn.path_generation_jobs
chapter.entity.ts             # trn.chapters
lesson.entity.ts              # trn.lessons
lesson-answer.entity.ts       # trn.lesson_answers
```

**Tutor entities** (`shared/domain/entities/tutor/`):
```
tutor-conversation.entity.ts  # trn.tutor_conversations
tutor-message.entity.ts       # trn.tutor_messages
```

**Content entities** (`shared/domain/entities/content/`):
```
summary.entity.ts             # trn.summaries
```

**Planning entities** (`shared/domain/entities/planning/`):
```
plan-task.entity.ts           # trn.plan_tasks
pomodoro-session.entity.ts    # trn.pomodoro_sessions
```

**User stats entity** (`shared/domain/entities/auth/`):
```
user-stats.entity.ts          # trn.user_stats
user-auth-provider.entity.ts  # trn.user_auth_providers (FK to cat.auth_providers)
```

Note: `con.xp_levels`, `con.pomodoro_presets`, `con.app_settings` also need entities if queried via TypeORM (read-only repositories for catalog context).

### Files to MODIFY
```
src/contexts/shared/shared.module.ts
  → NOT needed: each context registers own entities via TypeOrmModule.forFeature()
  → user.entity.ts stays here (cross-cutting for JWT guard)
```

---

## Slice 3 — User context extension

Extend existing `user` context with guest auth, account linking, profile CRUD, stats.

### Files to CREATE

**Guest auth:**
```
domain/contracts/i-guest-auth.use-case.ts
application/use-cases/guest-auth.use-case.ts
  → creates user with no email/name (is_guest flag or identified by null email)
  → guest session TTL from con.app_settings.guest_session_days
infrastructure/http-api/v1/auth/requests/guest-auth.request.ts  # (empty body or optional deviceId)
```

**Account linking (guest → social):**
```
domain/contracts/i-link-provider.use-case.ts
application/use-cases/link-provider.use-case.ts
  → validates social token
  → if provider already linked to another user → error
  → merges guest identity with social identity (keeps user id, adds provider record)
infrastructure/http-api/v1/auth/requests/link-google.request.ts
infrastructure/http-api/v1/auth/requests/link-apple.request.ts
```

**User profile:**
```
domain/contracts/i-user-profile.use-case.ts
application/use-cases/user-profile.use-case.ts
  → getMe, updateMe, deleteMe
infrastructure/http-api/v1/users/
  controllers/users.controller.ts       # GET/PATCH/DELETE /users/me
  requests/update-profile.request.ts
  responses/user-profile.response.ts
  users.module.ts
```

**Stats:**
```
domain/contracts/i-stats.use-case.ts
application/use-cases/stats.use-case.ts
  → reads from trn.user_stats (1:1 with user)
  → computes correct_answer_rate = correct_answers / total_question_answers
infrastructure/http-api/v1/stats/
  controllers/stats.controller.ts       # GET /stats
  responses/stats.response.ts
  stats.module.ts
```

**Update auth controller:**
```
auth.controller.ts
  → add: POST /auth/guest
  → add: POST /auth/link/google
  → add: POST /auth/link/apple
  → all link endpoints require JwtAuthGuard (not @Public())
```

**Update main.module.ts:**
```
user/infrastructure/main.module.ts
  → import UsersModule, StatsModule
```

---

## Slice 4 — Learning context

New bounded context at `src/contexts/learning/`.

### Use cases
```
application/use-cases/
  list-paths.use-case.ts           # GET /paths
  generate-path.use-case.ts        # POST /paths/generate → creates job + queues AI
  get-job-status.use-case.ts       # GET /paths/jobs/:jobId
  get-path.use-case.ts             # GET /paths/:id (with chapters)
  update-path.use-case.ts          # PATCH /paths/:id (title, description, status)
  delete-path.use-case.ts          # DELETE /paths/:id
  get-chapter.use-case.ts          # GET /paths/:pathId/chapters/:chapterId (with lessons)
  complete-chapter.use-case.ts     # POST .../complete
    → updates chapter status → 'completed'
    → unlocks next chapter → status 'current' (or 'completed' if last)
    → if last chapter → path status → 'completed'
    → updates user XP (trn.users.xp, trn.users.level via con.xp_levels thresholds)
    → updates trn.user_stats (chapters_completed, paths_completed if applicable)
  record-answer.use-case.ts        # POST .../lessons/:lessonId/answer
    → inserts trn.lesson_answers
    → updates trn.user_stats (correct_answers, total_question_answers, lessons_completed)
```

### Domain ports
```
domain/ports/
  learning-path.repository.port.ts
  chapter.repository.port.ts
  lesson.repository.port.ts
  lesson-answer.repository.port.ts
  path-generation-job.repository.port.ts
  ai-path-generator.port.ts          # interface for DeepSeek path generation
```

### DeepSeek path generation
```
infrastructure/services/
  deepseek-path-generator.service.ts
    → calls DeepSeek to generate structured JSON: { title, description, tags[], chapters: [{ title, lessons: [...] }] }
    → uses structured output / JSON mode
    → prompt: topic + mode (standard=5 chapters/4 lessons, deep=5 chapters/6 lessons)
    → on success: persists chapters + lessons, updates job status → 'completed'
    → on failure: updates job status → 'failed'
```

### HTTP modules
```
infrastructure/http-api/v1/
  paths/
    controllers/paths.controller.ts
    requests/generate-path.request.ts   # { topic: string, mode: 'standard' | 'deep' }
    requests/update-path.request.ts     # { title?, description?, status? }
    responses/path-list.response.ts
    responses/path-detail.response.ts   # includes chapters[]
    responses/job-status.response.ts
    paths.module.ts
  chapters/
    controllers/chapters.controller.ts
    requests/complete-chapter.request.ts  # { earnedXp, correctCount, totalQuestions }
    responses/chapter-detail.response.ts  # includes lessons[]
    chapters.module.ts
  lessons/
    controllers/lessons.controller.ts
    requests/answer-lesson.request.ts    # { selectedIndex?, selectedAnswer?, isCorrect }
    lessons.module.ts

main.module.ts
```

---

## Slice 5 — Tutor context

New bounded context at `src/contexts/tutor/`.

### Use cases
```
application/use-cases/
  list-conversations.use-case.ts
  create-conversation.use-case.ts
  get-conversation.use-case.ts
  update-conversation.use-case.ts    # title rename
  delete-conversation.use-case.ts
  get-messages.use-case.ts
  send-message.use-case.ts
    → inserts user message → calls DeepSeek chat → inserts model response → returns model message
  export-conversation-pdf.use-case.ts
    → fetches all messages → generates PDF via pdfkit → returns Buffer
  generate-audio.use-case.ts         # stub — returns 501 Not Implemented for now
```

### Domain ports
```
domain/ports/
  tutor-conversation.repository.port.ts
  tutor-message.repository.port.ts
  ai-tutor.port.ts                   # interface: sendMessage(history, userMessage) → string
```

### Infrastructure
```
infrastructure/services/
  deepseek-tutor.service.ts
    → implements ai-tutor.port.ts
    → sends full conversation history to DeepSeek chat completions
    → system prompt: "You are AutoLearner's AI tutor..."
  pdf-export.service.ts
    → uses pdfkit to format conversation as PDF
```

### HTTP modules
```
infrastructure/http-api/v1/tutor/
  controllers/tutor-conversations.controller.ts
  controllers/tutor-messages.controller.ts
  requests/create-conversation.request.ts    # { title? }
  requests/update-conversation.request.ts    # { title }
  requests/send-message.request.ts           # { content: string }
  responses/conversation.response.ts
  responses/message.response.ts
  tutor.module.ts

main.module.ts
```

---

## Slice 6 — Content context

New bounded context at `src/contexts/content/`.

### Use cases
```
application/use-cases/
  list-summaries.use-case.ts
  generate-summary.use-case.ts        # POST /summaries/generate — from plain text
    → calls DeepSeek → persists summary
  upload-and-summarize.use-case.ts    # POST /summaries/upload — from file
    → extracts text (pdf-parse | mammoth | plain read) → calls DeepSeek → persists
  get-summary.use-case.ts
  delete-summary.use-case.ts
  export-summary.use-case.ts          # GET /summaries/:id/export?format=pdf|docx|txt
    → pdf: pdfkit
    → txt: plain text Buffer
    → docx: stub (returns summary_text as plain text with .docx header for now)
```

### Domain ports
```
domain/ports/
  summary.repository.port.ts
  ai-summarizer.port.ts               # interface: summarize(text: string) → string
  file-extractor.port.ts              # interface: extract(buffer: Buffer, type: string) → string
```

### Infrastructure
```
infrastructure/services/
  deepseek-summarizer.service.ts
    → implements ai-summarizer.port.ts
    → prompt: "Generate a critical summary of the following text..."
  file-extractor.service.ts
    → implements file-extractor.port.ts
    → pdf: pdf-parse
    → docx: mammoth
    → txt/text: Buffer.toString('utf-8')
```

### HTTP modules
```
infrastructure/http-api/v1/summaries/
  controllers/summaries.controller.ts
    → POST /summaries/generate        # body: { text: string }
    → POST /summaries/upload          # multipart/form-data, file field
    → GET  /summaries
    → GET  /summaries/:id
    → DELETE /summaries/:id
    → GET  /summaries/:id/export      # query: ?format=pdf|txt|docx
  requests/generate-summary.request.ts
  responses/summary.response.ts
  summaries.module.ts

main.module.ts
```

**Note**: File upload uses `@nestjs/platform-express` multipart (`@UploadedFile()`, `FileInterceptor`). No multer storage — use `memoryStorage()`.

---

## Slice 7 — Planning context

New bounded context at `src/contexts/planning/`.

### Use cases
```
application/use-cases/
  list-tasks.use-case.ts             # GET /plan/tasks?date=YYYY-MM-DD
  create-task.use-case.ts
  get-task.use-case.ts
  update-task.use-case.ts            # toggle completed, edit fields
    → if marking completed: sets completed_at = NOW()
    → if un-completing: sets completed_at = null
  delete-task.use-case.ts
  list-pomodoro-presets.use-case.ts  # GET /plan/pomodoro/presets
  record-pomodoro-session.use-case.ts
    → inserts trn.pomodoro_sessions
    → if is_completed=true: updates user_stats.pomodoro_sessions_done + total_study_minutes
  list-pomodoro-sessions.use-case.ts # GET /plan/pomodoro/sessions?date=YYYY-MM-DD
```

### HTTP modules
```
infrastructure/http-api/v1/plan/
  controllers/tasks.controller.ts
  controllers/pomodoro.controller.ts
  requests/create-task.request.ts
  requests/update-task.request.ts
  requests/record-session.request.ts    # { durationMinutes, taskId? }
  responses/task.response.ts
  responses/pomodoro-session.response.ts
  responses/pomodoro-preset.response.ts
  plan.module.ts

main.module.ts
```

---

## Slice 8 — Catalog context

New bounded context at `src/contexts/catalog/`. Read-only. No use case layer — controllers query repositories directly (data is static reference data, no business logic).

```
infrastructure/http-api/v1/catalog/
  controllers/catalog.controller.ts
    → GET /catalog/tags
    → GET /catalog/xp-levels
  responses/tag.response.ts
  responses/xp-level.response.ts
  catalog.module.ts

main.module.ts
```

---

## Shared DeepSeek client (cross-context)

```
src/contexts/shared/infrastructure/services/
  deepseek.service.ts    # singleton OpenAI client with DeepSeek baseURL
  deepseek.module.ts     # global module, exports DeepseekService

src/contexts/shared/domain/ports/
  ai-client.port.ts      # generic: chat(messages, options) → string
```

`app.module.ts` imports `DeepseekModule` globally.

---

## App module wiring (final)

`src/app/app.module.ts` needs to import all context main modules:
```typescript
imports: [
  SharedModule,
  DeepseekModule,
  UserMainModule,      // auth + users + stats
  LearningMainModule,
  TutorMainModule,
  ContentMainModule,
  PlanningMainModule,
  CatalogMainModule,
]
```

---

## Implementation order (MVP first)

| Priority | Slice | Endpoints unlocked |
|---|---|---|
| 1 | Slice 0 | — install deps |
| 2 | Slice 1 | cleanup (no new endpoints) |
| 3 | Slice 2 | — entities only |
| 4 | Shared DeepSeek | — shared service |
| 5 | Slice 3 | Auth 3-7, GET/PATCH/DELETE /users/me, GET /stats |
| 6 | Slice 4 | All /paths + /chapters + /lessons endpoints |
| 7 | Slice 5 | All /tutor endpoints |
| 8 | Slice 6 | All /summaries endpoints |
| 9 | Slice 7 | All /plan endpoints |
| 10 | Slice 8 | GET /catalog/* |

Each slice = `pnpm build` passes + `pnpm test` passes before moving to next.

---

## Environment variables summary

```env
# Database
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USERNAME=
DB_PASSWORD=

# Redis
REDIS_HOST=
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Social auth
GOOGLE_CLIENT_ID=
APPLE_CLIENT_ID=

# DeepSeek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# App
PORT=3000
NODE_ENV=development
```
