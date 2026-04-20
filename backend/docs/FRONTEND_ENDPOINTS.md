# Frontend Endpoint Map

Base URL: `/api`

Admin routes require `Authorization: Bearer <token>`.

## Public / Candidate

### `POST /candidate/sessions/start`

Start or resume a candidate session by `name`, `surname`, and `uin`.

### `GET /candidate/sessions/:sessionId`

Resume an existing session and refresh its server-controlled timing state.

### `PATCH /candidate/sessions/:sessionId/answers`

Autosave a single answer with:

- `sessionQuestionId`
- `answer`
- `currentQuestionIndex`
- `currentSection`

### `POST /candidate/sessions/:sessionId/advance-section`

Move from a completed section break into the next section.

### `POST /candidate/sessions/:sessionId/complete`

Finalize scoring and return the learner-safe result payload.

## Admin Auth

### `POST /admin/auth/login`

Returns `{ admin, token }`.

### `POST /admin/auth/logout`

Ends the current admin session token on the client side.

### `GET /admin/auth/me`

Restores the current admin profile from the bearer token.

## Admin Subjects

### `GET /admin/subjects`

List active subjects plus question-bank counts.

### `POST /admin/subjects`

Create a subject with `name`, `timeLimitSeconds`, and `questionCount`.

### `PATCH /admin/subjects/:id`

Update subject details.

### `DELETE /admin/subjects/:id`

Permanently delete a subject and remove linked editable data.

## Admin Questions

### `GET /admin/questions?subjectId=&search=&page=&limit=`

Paginated question list.

### `POST /admin/questions`

Create a question with optional `imageUrl`.

### `PATCH /admin/questions/:id`

Update question details.

### `DELETE /admin/questions/:id`

Permanently delete a question from the bank.

## Admin Uploads

### `POST /admin/uploads/question-image`

Multipart upload endpoint for the `file` field. Returns `{ filename, originalName, mimeType, size, url }`.

## Admin UINs

### `GET /admin/uins?status=&search=`

List UINs plus summary counts.

### `POST /admin/uins/generate`

Generate one or more UINs with assigned subject IDs.

### `DELETE /admin/uins/:id`

Permanently delete an unused available UIN.

## Admin Results

### `GET /admin/results?search=&sortBy=&sortOrder=&academicYear=&page=&limit=`

Paginated result list with learner and breakdown data.

### `GET /admin/results/:id`

Fetch one result in full.

## Admin Analytics

### `GET /admin/analytics/academic-years`

Returns academic-year summaries with:

- `academicYear`
- `totalTests`
- `passed`
- `failed`
- `passRate`
- `averageScore`

## Health

### `GET /health`

Service health check for deployment verification.
