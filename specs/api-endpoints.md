# API Endpoints — AutoLearner

Endpoints required to connect the app with the backend.
Updated: 2026-06-04 (complete)

Legend: ✅ implemented — ⬜ pending

---

## Auth

1. ✅ `POST /api/v1/auth/google` — Login or register with Google ID token
2. ✅ `POST /api/v1/auth/apple` — Login or register with Apple identity token
3. ✅ `POST /api/v1/auth/guest` — Create anonymous guest session
4. ✅ `POST /api/v1/auth/link/google` — Link Google account to existing guest session (preserves data)
5. ✅ `POST /api/v1/auth/link/apple` — Link Apple account to existing guest session (preserves data)
6. ✅ `POST /api/v1/auth/refresh` — Rotate token pair (blacklists old refresh token)
7. ✅ `POST /api/v1/auth/logout` — Blacklist access + refresh token

## User

8. ✅ `GET /api/v1/users/me` — Get profile (name, XP, level, streak, avatar)
9. ✅ `PATCH /api/v1/users/me` — Update profile (name, avatar_url)
10. ✅ `DELETE /api/v1/users/me` — Delete account and all associated data

## Stats

11. ✅ `GET /api/v1/stats` — Get dashboard stats (study hours, paths completed, correct answer rate)

## Learning Paths

12. ✅ `GET /api/v1/paths` — List all user paths (`?tagId=uuid` for tag filter)
13. ✅ `POST /api/v1/paths/generate` — Trigger AI path generation (body: `topic`, `mode: standard|deep`)
14. ✅ `GET /api/v1/paths/jobs/:jobId` — Poll generation job status
15. ✅ `GET /api/v1/paths/:id` — Get path with chapters and progress
16. ✅ `PATCH /api/v1/paths/:id` — Update path (title, description, status: archive/restore)
17. ✅ `DELETE /api/v1/paths/:id` — Delete path

## Chapters

18. ✅ `GET /api/v1/paths/:pathId/chapters/:chapterId` — Get chapter with lessons
19. ✅ `POST /api/v1/paths/:pathId/chapters/:chapterId/complete` — Complete chapter (body: `earnedXp`, `correctCount`, `totalQuestions`)

## Lessons

20. ✅ `POST /api/v1/paths/:pathId/chapters/:chapterId/lessons/:lessonId/answer` — Record lesson answer (body: `selectedIndex?`, `selectedAnswer?`, `isCorrect`)

## Tutor AI

21. ✅ `GET /api/v1/tutor/conversations` — List conversations
22. ✅ `POST /api/v1/tutor/conversations` — Create new conversation
23. ✅ `GET /api/v1/tutor/conversations/:id` — Get conversation metadata
24. ✅ `PATCH /api/v1/tutor/conversations/:id` — Update conversation title
25. ✅ `DELETE /api/v1/tutor/conversations/:id` — Delete conversation and messages
26. ✅ `GET /api/v1/tutor/conversations/:id/messages` — Get message history
27. ✅ `POST /api/v1/tutor/conversations/:id/messages` — Send message → receive AI response
28. ✅ `POST /api/v1/tutor/conversations/:id/export/pdf` — Export conversation as PDF
29. ✅ `POST /api/v1/tutor/conversations/:id/audio` — Generate audio version of conversation

## Summaries

30. ✅ `GET /api/v1/summaries` — List user summaries
31. ✅ `POST /api/v1/summaries/generate` — Generate summary from plain text
32. ✅ `POST /api/v1/summaries/upload` — Upload file (PDF, DOCX, TXT) → extract + summarize
33. ✅ `GET /api/v1/summaries/:id` — Get single summary
34. ✅ `DELETE /api/v1/summaries/:id` — Delete summary
35. ✅ `GET /api/v1/summaries/:id/export` — Download summary (`?format=pdf|docx|txt`)

## Plan / Tasks

36. ✅ `GET /api/v1/plan/tasks` — List tasks (`?date=YYYY-MM-DD`)
37. ✅ `POST /api/v1/plan/tasks` — Create task (body: `title`, `scheduledTime?`, `scheduledDate`)
38. ✅ `GET /api/v1/plan/tasks/:id` — Get single task
39. ✅ `PATCH /api/v1/plan/tasks/:id` — Update task (toggle completed, edit title/time/date)
40. ✅ `DELETE /api/v1/plan/tasks/:id` — Delete task

## Pomodoro

41. ✅ `GET /api/v1/plan/pomodoro/presets` — List available durations (from con.pomodoro_presets)
42. ✅ `POST /api/v1/plan/pomodoro/sessions` — Record completed session (body: `durationMinutes`, `taskId?`)
43. ✅ `GET /api/v1/plan/pomodoro/sessions` — Session history (`?date=YYYY-MM-DD` for daily count)

## Catalog

44. ✅ `GET /api/v1/catalog/tags` — List available tags (for path filtering)
45. ✅ `GET /api/v1/catalog/xp-levels` — List XP thresholds per level (for progress bar in frontend)

---

## Implementation status
**All 45 endpoints implemented.**
