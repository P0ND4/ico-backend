-- Database Schema Creation Script
CREATE SCHEMA IF NOT EXISTS cat;  -- static catalog data
CREATE SCHEMA IF NOT EXISTS con;   -- application configuration
CREATE SCHEMA IF NOT EXISTS trn;   -- transactional data

-- PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- text search by trigram

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Catalog Tables
CREATE TABLE cat.auth_providers (
  id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL
);

-- UUIDs must match AUTH_PROVIDER_IDS in src/contexts/shared/constants/provider.constants.ts
INSERT INTO cat.auth_providers (id, name, label) VALUES
  ('00000000-0000-0000-0000-000000000001', 'google', 'Google'),
  ('00000000-0000-0000-0000-000000000002', 'apple',  'Apple ID'),
  ('00000000-0000-0000-0000-000000000003', 'guest',  'Invitado');


-- Learning path modes
CREATE TABLE cat.path_modes (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.path_modes (code, label) VALUES
  ('standard', 'Estándar'),
  ('deep',     'Profundo');


-- Learning path statuses
CREATE TABLE cat.path_statuses (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.path_statuses (code, label) VALUES
  ('active',    'Activa'),
  ('completed', 'Completada'),
  ('archived',  'Archivada');


-- AI generation job statuses
CREATE TABLE cat.job_statuses (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.job_statuses (code, label) VALUES
  ('pending',    'Pendiente'),
  ('processing', 'Procesando'),
  ('completed',  'Completado'),
  ('failed',     'Fallido');


-- Chapter statuses
CREATE TABLE cat.chapter_statuses (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.chapter_statuses (code, label) VALUES
  ('locked',    'Bloqueado'),
  ('current',   'En curso'),
  ('completed', 'Completado');


-- Lesson types
CREATE TABLE cat.lesson_types (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.lesson_types (code, label) VALUES
  ('theory',          'Teoría'),
  ('concept',         'Concepto'),
  ('example',         'Ejemplo'),
  ('multiple_choice', 'Opción múltiple'),
  ('true_false',      'Verdadero/Falso');


-- Tutor message roles
CREATE TABLE cat.message_roles (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.message_roles (code, label) VALUES
  ('user',  'Usuario'),
  ('model', 'Modelo');


-- Summary source types
CREATE TABLE cat.source_types (
  code  VARCHAR(50)  PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

INSERT INTO cat.source_types (code, label) VALUES
  ('text', 'Texto plano'),
  ('pdf',  'PDF'),
  ('docx', 'Word'),
  ('txt',  'TXT');


-- Learning path tags
CREATE TABLE cat.tags (
  id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7)   NOT NULL
);

INSERT INTO cat.tags (name, color) VALUES
  ('Ciencias',      '#059669'),
  ('Historia',      '#0891B2'),
  ('Programación',  '#7C3AED'),
  ('Matemáticas',   '#D97706'),
  ('Literatura',    '#DC2626'),
  ('Filosofía',     '#6B7280'),
  ('Arte',          '#EC4899'),
  ('Economía',      '#F59E0B');

-- Configuration xp_levels
CREATE TABLE con.xp_levels (
  level        INTEGER      PRIMARY KEY CHECK (level >= 1),
  label        VARCHAR(100) NOT NULL,   -- e.g. 'Principiante', 'Explorador'
  min_xp       INTEGER      NOT NULL CHECK (min_xp >= 0),
  max_xp       INTEGER      NOT NULL CHECK (max_xp > min_xp),
  CONSTRAINT chk_xp_range CHECK (max_xp > min_xp)
);

INSERT INTO con.xp_levels (level, label, min_xp, max_xp) VALUES
  (1,  'Principiante',  0,    499),
  (2,  'Explorador',    500,  1099),
  (3,  'Estudiante',    1100, 1999),
  (4,  'Analista',      2000, 3199),
  (5,  'Pensador',      3200, 4799),
  (6,  'Investigador',  4800, 6799),
  (7,  'Experto',       6800, 9299),
  (8,  'Maestro',       9300, 12299),
  (9,  'Visionario',    12300, 15999),
  (10, 'AutoLearner',   16000, 2147483647);


-- Pomodoro Presets
CREATE TABLE con.pomodoro_presets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_minutes INTEGER     NOT NULL UNIQUE CHECK (duration_minutes > 0),
  label            VARCHAR(50) NOT NULL,    -- e.g. 'Sesión corta', 'Estándar', 'Sesión larga'
  is_default       BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order       INTEGER     NOT NULL
);

INSERT INTO con.pomodoro_presets (duration_minutes, label, is_default, sort_order) VALUES
  (25, 'Sesión corta',  FALSE, 1),
  (45, 'Estándar',      TRUE,  2),
  (60, 'Sesión larga',  FALSE, 3);

-- App settings
CREATE TABLE con.app_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT         NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON con.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO con.app_settings (key, value, description) VALUES
  ('ai_model',                  'gpt-4o',     'Modelo de IA usado para generación de rutas y tutor'),
  ('max_chapters_per_path',     '5',          'Cantidad máxima de capítulos por ruta generada'),
  ('max_lessons_per_chapter',   '6',          'Cantidad máxima de lecciones por capítulo'),
  ('guest_session_days',        '7',          'Días de validez de una sesión de invitado'),
  ('xp_per_correct_answer',     '20',         'XP base otorgado por respuesta correcta'),
  ('path_generation_timeout_s', '30',         'Segundos máximos para esperar generación de ruta');

-- Transactional Tables
CREATE TABLE trn.users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100),
  email          VARCHAR(255) UNIQUE,
  avatar_url     TEXT,
  xp             INTEGER      NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level          INTEGER      NOT NULL DEFAULT 1 REFERENCES con.xp_levels(level),
  streak_days    INTEGER      NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_active_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_trn_users_updated_at
  BEFORE UPDATE ON trn.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User stats 1:1
CREATE TABLE trn.user_stats (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL UNIQUE REFERENCES trn.users(id) ON DELETE CASCADE,
  total_study_minutes    INTEGER     NOT NULL DEFAULT 0,
  paths_completed        INTEGER     NOT NULL DEFAULT 0,
  chapters_completed     INTEGER     NOT NULL DEFAULT 0,
  lessons_completed      INTEGER     NOT NULL DEFAULT 0,
  correct_answers        INTEGER     NOT NULL DEFAULT 0,
  total_question_answers INTEGER     NOT NULL DEFAULT 0,
  pomodoro_sessions_done INTEGER     NOT NULL DEFAULT 0,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_trn_user_stats_updated_at
  BEFORE UPDATE ON trn.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User authentication providers (Apple, Google, Guest) n:n
CREATE TABLE trn.user_auth_providers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  provider_id      UUID        NOT NULL REFERENCES cat.auth_providers(id),
  provider_user_id VARCHAR(255),                    -- external provider ID (Apple sub, Google sub)
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, provider_user_id)             -- same external ID cannot be linked twice
);

-- User learning paths 1:n
CREATE TABLE trn.learning_paths (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  topic             TEXT         NOT NULL,
  description       TEXT,
  mode              VARCHAR(50)  NOT NULL DEFAULT 'standard' REFERENCES cat.path_modes(code),
  status            VARCHAR(50)  NOT NULL DEFAULT 'active'   REFERENCES cat.path_statuses(code),
  total_xp          INTEGER      NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  earned_xp         INTEGER      NOT NULL DEFAULT 0 CHECK (earned_xp >= 0),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_trn_learning_paths_updated_at
  BEFORE UPDATE ON trn.learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User learning path chapters n:n
CREATE TABLE trn.path_tags (
  path_id UUID NOT NULL REFERENCES trn.learning_paths(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES cat.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (path_id, tag_id)
);

-- Track the status of the asynchronous AI generation job. 1:1
CREATE TABLE trn.path_generation_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id     UUID        NOT NULL UNIQUE REFERENCES trn.learning_paths(id) ON DELETE CASCADE,
  status      VARCHAR(50) NOT NULL DEFAULT 'pending' REFERENCES cat.job_statuses(code),
  error_msg   TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User learning path chapters 1:n
CREATE TABLE trn.chapters (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id         UUID         NOT NULL REFERENCES trn.learning_paths(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  "order"         INTEGER      NOT NULL CHECK ("order" >= 1),
  status          VARCHAR(50)  NOT NULL DEFAULT 'locked' REFERENCES cat.chapter_statuses(code),
  max_xp          INTEGER      NOT NULL DEFAULT 0,
  earned_xp       INTEGER      NOT NULL DEFAULT 0,
  correct_answers INTEGER      NOT NULL DEFAULT 0,
  total_questions INTEGER      NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (path_id, "order")
);

-- User learning path lessons 1:n
CREATE TABLE trn.lessons (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id     UUID         NOT NULL REFERENCES trn.chapters(id) ON DELETE CASCADE,
  type           VARCHAR(50)  NOT NULL REFERENCES cat.lesson_types(code),
  title          VARCHAR(255),
  content        TEXT         NOT NULL,
  question       TEXT,
  options        JSONB,        -- multiple_choice options array: ["Option A", "Option B", ...]
  correct_index  INTEGER,      -- multiple_choice: 0-based index of the correct option
  correct_answer BOOLEAN,      -- true_false correct answer
  points         INTEGER       NOT NULL DEFAULT 0 CHECK (points >= 0),
  "order"        INTEGER       NOT NULL CHECK ("order" >= 1),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (chapter_id, "order")
);

-- Lesson answers
CREATE TABLE trn.lesson_answers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  lesson_id       UUID        NOT NULL REFERENCES trn.lessons(id) ON DELETE CASCADE,
  selected_index  INTEGER,    -- answer choice multiple_choice
  selected_answer BOOLEAN,    -- answer choice true_false
  is_correct      BOOLEAN     NOT NULL,
  points_earned   INTEGER     NOT NULL DEFAULT 0,
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversational tutor interactions
CREATE TABLE trn.tutor_conversations (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  title      VARCHAR(255),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_trn_tutor_conversations_updated_at
  BEFORE UPDATE ON trn.tutor_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Messages in the tutor conversation
CREATE TABLE trn.tutor_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES trn.tutor_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL REFERENCES cat.message_roles(code),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User summaries of external content (text, PDF, DOCX)
CREATE TABLE trn.summaries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  original_text   TEXT        NOT NULL,
  summary_text    TEXT        NOT NULL,
  source_filename VARCHAR(255),
  source_type     VARCHAR(50) REFERENCES cat.source_types(code),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plan tasks
CREATE TABLE trn.plan_tasks (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  scheduled_time TIME,
  scheduled_date DATE         NOT NULL,
  is_completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_trn_plan_tasks_updated_at
  BEFORE UPDATE ON trn.plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pomodoro sessions
CREATE TABLE trn.pomodoro_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES trn.users(id) ON DELETE CASCADE,
  task_id          UUID        REFERENCES trn.plan_tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER     NOT NULL REFERENCES con.pomodoro_presets(duration_minutes),
  is_completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ
);

-- Indexes
-- trn.users
CREATE INDEX idx_trn_users_email           ON trn.users (email);

-- trn.user_auth_providers
CREATE INDEX idx_trn_uap_user_id           ON trn.user_auth_providers (user_id);
CREATE INDEX idx_trn_uap_provider          ON trn.user_auth_providers (provider_id, provider_user_id);

-- trn.learning_paths
CREATE INDEX idx_trn_paths_user_id         ON trn.learning_paths (user_id);
CREATE INDEX idx_trn_paths_user_status     ON trn.learning_paths (user_id, status);
CREATE INDEX idx_trn_paths_title_trgm      ON trn.learning_paths USING gin (title gin_trgm_ops);

-- trn.path_tags
CREATE INDEX idx_trn_path_tags_path_id     ON trn.path_tags (path_id);
CREATE INDEX idx_trn_path_tags_tag_id      ON trn.path_tags (tag_id);

-- trn.chapters
CREATE INDEX idx_trn_chapters_path_id      ON trn.chapters (path_id, "order");

-- trn.lessons
CREATE INDEX idx_trn_lessons_chapter_id    ON trn.lessons (chapter_id, "order");

-- trn.lesson_answers
CREATE INDEX idx_trn_answers_user_id       ON trn.lesson_answers (user_id);
CREATE INDEX idx_trn_answers_lesson_id     ON trn.lesson_answers (lesson_id);

-- trn.tutor_conversations
CREATE INDEX idx_trn_convs_user_id         ON trn.tutor_conversations (user_id);

-- trn.tutor_messages
CREATE INDEX idx_trn_msgs_conversation     ON trn.tutor_messages (conversation_id, created_at);

-- trn.summaries
CREATE INDEX idx_trn_summaries_user_id     ON trn.summaries (user_id);

-- trn.plan_tasks
CREATE INDEX idx_trn_tasks_user_date       ON trn.plan_tasks (user_id, scheduled_date);

-- trn.pomodoro_sessions
CREATE INDEX idx_trn_pomodoro_user_id      ON trn.pomodoro_sessions (user_id);
CREATE INDEX idx_trn_pomodoro_task_id      ON trn.pomodoro_sessions (task_id);

-- =============================================================================
-- SCHEMA AND TABLE SUMMARY
-- =============================================================================
--
--  cat (catalog — read-only reference data)
--  ├── auth_providers         static values: apple, google, guest
--  ├── tags                   topic categories: Ciencias, Historia, etc.
--  ├── path_modes             learning path modes: standard, deep
--  ├── path_statuses          learning path statuses: active, completed, archived
--  ├── job_statuses           AI generation job statuses: pending, processing, completed, failed
--  ├── chapter_statuses       chapter statuses: locked, current, completed
--  ├── lesson_types           lesson types: theory, example, multiple_choice, true_false
--  ├── message_roles          tutor message roles: user, model
--  └── source_types           summary source types: text, pdf, docx, txt
--
--  con (system configuration)
--  ├── xp_levels              XP thresholds per level (1-10)
--  ├── pomodoro_presets       timer durations: 25 / 45 / 60 min
--  └── app_settings           global flags and parameters (key-value)
--
--  trn (transactional — generated by users or the app)
--  ├── users                  user records
--  ├── user_stats             accumulated metrics            [1:1 → users]
--  ├── user_auth_providers    linked login methods           [N:N → cat.auth_providers]
--  ├── learning_paths         learning paths                 [1:N → users]
--  ├── path_tags              assigned categories            [N:N → cat.tags]
--  ├── path_generation_jobs   async AI generation job state  [1:1 → learning_paths]
--  ├── chapters               chapters of a path             [1:N → learning_paths]
--  ├── lessons                lessons of a chapter           [1:N → chapters]
--  ├── lesson_answers         user answers                   [1:N → users, lessons]
--  ├── tutor_conversations    tutor conversations            [1:N → users]
--  ├── tutor_messages         messages per conversation      [1:N → tutor_conversations]
--  ├── summaries              generated summaries            [1:N → users]
--  ├── plan_tasks             planner tasks                  [1:N → users]
--  └── pomodoro_sessions      recorded Pomodoro sessions     [1:N → users, plan_tasks]
--
-- =============================================================================
--
--  CROSS-SCHEMA RELATIONSHIPS
--
--  trn.users                  → con.xp_levels              (level FK)
--  trn.user_auth_providers    → cat.auth_providers         (provider_id FK)
--  trn.path_tags              → cat.tags                   (tag_id FK)
--  trn.pomodoro_sessions      → con.pomodoro_presets       (duration_minutes FK)
--  trn.learning_paths         → cat.path_modes             (mode FK)
--  trn.learning_paths         → cat.path_statuses          (status FK)
--  trn.path_generation_jobs   → cat.job_statuses           (status FK)
--  trn.chapters               → cat.chapter_statuses       (status FK)
--  trn.lessons                → cat.lesson_types           (type FK)
--  trn.tutor_messages         → cat.message_roles          (role FK)
--  trn.summaries              → cat.source_types           (source_type FK)
--
-- =============================================================================
