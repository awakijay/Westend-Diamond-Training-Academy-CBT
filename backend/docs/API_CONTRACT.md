# API Contract

Base path: `/api`

This document mirrors the frontend behavior that already exists in the CBT app and turns it into a backend-facing route contract.

## Admin Auth

### `POST /api/admin/auth/login`

Purpose:
- authenticate an admin
- return admin profile and token/session

Body:

```json
{
  "username": "admin",
  "password": "secret"
}
```

### `POST /api/admin/auth/logout`

Purpose:
- end the admin session

### `GET /api/admin/auth/me`

Purpose:
- restore admin state on refresh

## Subjects

### `GET /api/admin/subjects`

Purpose:
- list subjects with current timer and question count configuration

### `POST /api/admin/subjects`

Body:

```json
{
  "name": "Course 1",
  "timeLimitSeconds": 1800,
  "questionCount": 10
}
```

### `PATCH /api/admin/subjects/:id`

Purpose:
- update name, timer, or question count

### `DELETE /api/admin/subjects/:id`

Purpose:
- soft-delete or deactivate a subject

## Questions

### `GET /api/admin/questions`

Query params:
- `subjectId`
- `search`
- `page`
- `limit`

### `POST /api/admin/questions`

Body:

```json
{
  "subjectId": "sub_001",
  "question": "Question text",
  "imageUrl": "https://cdn.example.com/image.png",
  "optionA": "Option A",
  "optionB": "Option B",
  "optionC": "Option C",
  "optionD": "Option D",
  "correctAnswer": "B"
}
```

### `PATCH /api/admin/questions/:id`

### `DELETE /api/admin/questions/:id`

## Uploads

### `POST /api/admin/uploads/question-image`

Purpose:
- upload a question illustration
- return a hosted file URL and metadata

## UINs

### `GET /api/admin/uins`

Query params:
- `status=available|used|all`
- `search`

### `POST /api/admin/uins/generate`

Body:

```json
{
  "count": 20,
  "subjectIds": ["sub_001", "sub_002", "sub_003"],
  "subjectsPerUin": 3
}
```

### `DELETE /api/admin/uins/:id`

Purpose:
- delete unused UINs or mark them void

## Candidate Sessions

### `POST /api/candidate/sessions/start`

Body:

```json
{
  "name": "John",
  "surname": "Doe",
  "uin": "TRN-AB12CD"
}
```

Expected behavior:
- validate the UIN
- load assigned subjects
- verify enough active questions exist
- create the immutable session snapshot
- lock the UIN atomically
- return learner-safe session data without answer keys

### `GET /api/candidate/sessions/:sessionId`

Purpose:
- resume an active session

### `PATCH /api/candidate/sessions/:sessionId/answers`

Body:

```json
{
  "sessionQuestionId": "sessq_001",
  "answer": "C",
  "currentQuestionIndex": 4,
  "currentSection": 0
}
```

Note:
- this scaffold uses `sessionQuestionId` instead of raw `questionId` so answers are always tied to the exact immutable session snapshot

### `POST /api/candidate/sessions/:sessionId/advance-section`

Body:

```json
{
  "nextSectionIndex": 1
}
```

### `POST /api/candidate/sessions/:sessionId/complete`

Purpose:
- finalize scoring
- create result records
- return pass/fail outcome and section breakdown

## Results

### `GET /api/admin/results`

Query params:
- `search`
- `sortBy=date|score|name`
- `sortOrder=asc|desc`
- `academicYear`
- `page`
- `limit`

### `GET /api/admin/results/:id`

Purpose:
- fetch one result with section breakdown

## Analytics

### `GET /api/admin/analytics/academic-years`

Purpose:
- return academic-year summary metrics

## Notes

- Pass mark is `50%`
- Academic year rule follows the existing frontend logic:
  - September or later: `YYYY/YYYY+1`
  - Before September: `YYYY-1/YYYY`
- Learner-facing responses must never include correct answers
- Session scoring and timer enforcement belong to the backend
