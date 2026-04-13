# Backend Handoff for Westend Diamond Training Academy CBT

## Purpose

This document is for the developer building the backend for the current CBT frontend.

The frontend is a Vite + React application with:

- A student flow for starting and taking a CBT exam
- An admin flow for managing courses, questions, UINs, and results


There is no real backend integration yet. The backend will become the source of truth for authentication, exam setup, question bank management, UIN lifecycle, active test sessions, submissions, and reporting.

## Where the current frontend behavior lives

Use these files as the functional reference:

- `src/types/index.ts`: current data shapes
- `src/utils/storage.ts`: local persistence methods that will later map to API calls
- `src/utils/testUtils.ts`: question selection, timing helpers, scoring, and academic logic
- `src/app/pages/LandingPage.tsx`: learner start flow
- `src/app/pages/TestPage.tsx`: active test flow
- `src/app/pages/ResultsPage.tsx`: learner result view
- `src/app/pages/admin/AdminLogin.tsx`: current placeholder admin auth
- `src/app/pages/admin/AdminQuestions.tsx`: course/question management
- `src/app/pages/admin/AdminUINGenerator.tsx`: course configuration, timers, question counts, UIN generation
- `src/app/pages/admin/AdminResults.tsx`: results list/search/export
- `src/app/pages/admin/AdminDashboard.tsx`: dashboard analytics

## Current frontend behavior

### 1. Student flow

On the landing page, a learner enters:

- `name`
- `surname`
- `uin`

The UI currently does the following:

1. Validates that the UIN exists and is unused
2. Determines which courses/sections belong to that UIN
3. Checks that enough questions exist for each assigned section
4. Builds a session with:
   - selected sections
   - section timers
   - question counts
   - randomized question IDs
   - answer map
   - start timestamps
5. Marks the UIN as used immediately
6. Sends the learner into the test flow

### 2. Test flow

The test is section-based.

- Each section has its own timer
- Learners answer one question at a time
- When a section ends, the UI moves to a section-break state
- Finished sections cannot be reopened
- At the end, the UI calculates section scores and total score
- A final result record is stored

The current frontend also assumes sessions can be resumed on the same device because everything is stored locally.

### 3. Admin flow

The admin area currently supports:

- Admin login
- Course creation and editing
- Timer per course
- Question-count per course
- Question CRUD
- Optional question image upload
- UIN generation
- Viewing available vs used UINs
- Viewing completed results
- Simple analytics by academic year
- CSV/PDF-style export from the browser

## Core business rules already implied by the frontend

These rules should be preserved unless the product owner changes them:

- A UIN can only be used once
- Each UIN may be assigned one or more courses
- Question counts are configured per course
- Timers are configured per course
- Pass mark is `50%`
- Academic year is computed as:
  - if month is September or later: `YYYY/YYYY+1`
  - otherwise: `YYYY-1/YYYY`
- Questions are currently randomized per UIN and per section using a seeded shuffle
- Results include both total score and per-section breakdown

### Important implementation note

The current frontend labels one setting as "Courses per UIN", but in practice it assigns the first `N` selected courses to every generated UIN, not a random or mixed subset per UIN. This should be clarified before backend implementation so both sides follow the same rule.

## Current frontend data model

These are the current shapes used by the app.

### Subject / Course

```ts
interface SubjectConfig {
  id: string;
  name: string;
  minutes: number;
  questions: number;
}
```

Notes:

- In the UI, `minutes` is entered in minutes
- Time limits are also stored elsewhere in seconds by course name
- The backend should keep a single source of truth and avoid duplicating this concept

### Question

```ts
interface Question {
  id: string;
  section: string;
  question: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}
```

Recommendation:

- Store `subjectId` in the backend rather than relying only on course name
- Return both `subjectId` and `subjectName` to the frontend if helpful

### UIN

```ts
interface UIN {
  id: string;
  code: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
  subjectCount?: number;
  subjects?: string[];
}
```

Notes:

- UIN format currently looks like `TRN-XXXXXX`
- UINs need course assignments
- `usedBy` is currently a free-text full name

### Active Test Session

```ts
interface TestSession {
  uin: string;
  name: string;
  surname: string;
  currentSection: number;
  pendingSectionIndex?: number | null;
  isOnSectionBreak?: boolean;
  currentQuestionIndex: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  selectedQuestionIds?: string[];
  selectedSections: string[];
  sectionTimeLimits: Record<string, number>;
  sectionQuestionCounts: Record<string, number>;
  startTime: string;
  sectionStartTime: string;
}
```

Recommendation:

- Add a real backend `sessionId`
- Store section progress server-side
- Keep `sectionTimeLimits` immutable once a session starts
- Persist answers progressively so refresh/device loss does not destroy the attempt

### Result

```ts
interface TestResult {
  id: string;
  uin: string;
  name: string;
  surname: string;
  sectionResults: { section: string; score: number; total: number }[];
  totalScore: number;
  totalQuestions: number;
  completedAt: string;
  academicYear: string;
}
```

## Recommended backend responsibilities

The backend should own:

- Admin authentication and authorization
- Course management
- Question bank CRUD
- Question image storage
- UIN generation and lifecycle
- Starting and validating exam sessions
- Locking a UIN when a test starts
- Saving answers during the test
- Final scoring and result creation
- Reporting and analytics

The frontend should not be the final authority for:

- Whether a UIN is valid
- Which questions belong to a session
- Timer enforcement
- Marking a UIN as used
- Scoring
- Pass/fail state

## Suggested API surface

The exact routes can vary, but the backend should expose something close to this.

### Admin auth

#### `POST /api/admin/auth/login`

Request:

```json
{
  "username": "admin",
  "password": "secret"
}
```

Response:

```json
{
  "admin": {
    "id": "adm_001",
    "username": "admin",
    "name": "System Admin"
  },
  "token": "jwt-or-session-token"
}
```

#### `POST /api/admin/auth/logout`

#### `GET /api/admin/me`

Used to restore admin state on refresh.

### Courses / subjects

#### `GET /api/admin/subjects`

Returns all courses with exam settings and optional question-bank counts.

#### `POST /api/admin/subjects`

Create a course.

#### `PATCH /api/admin/subjects/:id`

Update:

- course name
- timer minutes
- question count

#### `DELETE /api/admin/subjects/:id`

Important:

- Define what happens to linked questions, UINs, past sessions, and results
- Soft-delete may be safer than hard-delete

### Questions

#### `GET /api/admin/questions`

Supported query params:

- `subjectId`
- `search`
- `page`
- `limit`

#### `POST /api/admin/questions`

Request:

```json
{
  "subjectId": "sub_001",
  "question": "Question text",
  "imageUrl": "https://cdn.example.com/question-image.png",
  "optionA": "Option A",
  "optionB": "Option B",
  "optionC": "Option C",
  "optionD": "Option D",
  "correctAnswer": "B"
}
```

#### `PATCH /api/admin/questions/:id`

#### `DELETE /api/admin/questions/:id`

### Question images

Choose one of these patterns:

- `POST /api/admin/uploads/question-image` and return a hosted URL
- Direct client upload to S3/Cloudinary/etc. with signed upload support

The frontend currently stores image data inline as a base64 string. That should be replaced with real file storage.

### UIN management

#### `GET /api/admin/uins`

Supported query params:

- `status=available|used|all`
- `search`

#### `POST /api/admin/uins/generate`

Suggested request:

```json
{
  "count": 20,
  "subjectIds": ["sub_001", "sub_002", "sub_003"],
  "subjectsPerUin": 3
}
```

Suggested response:

```json
{
  "created": [
    {
      "id": "uin_001",
      "code": "TRN-AB12CD",
      "used": false,
      "createdAt": "2026-04-13T12:00:00.000Z",
      "subjectCount": 3,
      "subjects": [
        { "id": "sub_001", "name": "Course 1" },
        { "id": "sub_002", "name": "Course 2" },
        { "id": "sub_003", "name": "Course 3" }
      ]
    }
  ]
}
```

#### `DELETE /api/admin/uins/:id`

Decide whether used UINs can ever be deleted.

### Candidate test start

#### `POST /api/candidate/sessions/start`

Request:

```json
{
  "name": "John",
  "surname": "Doe",
  "uin": "TRN-AB12CD"
}
```

Expected backend behavior:

1. Validate UIN
2. Ensure UIN is unused and active
3. Load assigned courses
4. Load current timer and question-count settings for those courses
5. Verify enough questions exist
6. Select the exact question set for this candidate
7. Create a session
8. Lock or consume the UIN atomically
9. Return the session payload needed for the test UI

Suggested response:

```json
{
  "sessionId": "sess_001",
  "candidate": {
    "name": "John",
    "surname": "Doe",
    "uin": "TRN-AB12CD"
  },
  "currentSection": 0,
  "currentQuestionIndex": 0,
  "selectedSections": [
    { "id": "sub_001", "name": "Course 1" },
    { "id": "sub_002", "name": "Course 2" }
  ],
  "sectionTimeLimits": {
    "Course 1": 1800,
    "Course 2": 1200
  },
  "sectionQuestionCounts": {
    "Course 1": 10,
    "Course 2": 8
  },
  "questions": [
    {
      "id": "q_001",
      "section": "Course 1",
      "question": "Question text",
      "imageUrl": null,
      "optionA": "A",
      "optionB": "B",
      "optionC": "C",
      "optionD": "D"
    }
  ],
  "startTime": "2026-04-13T12:00:00.000Z",
  "sectionStartTime": "2026-04-13T12:00:00.000Z"
}
```

Important:

- Do not send `correctAnswer` to the learner-facing start-session response

### Candidate session resume

#### `GET /api/candidate/sessions/:sessionId`

Returns the active session state, including saved answers and timing info.

If the product should support resume by UIN instead of session ID, expose a verified endpoint for that.

### Save answer / progress

#### `PATCH /api/candidate/sessions/:sessionId/answers`

Suggested request:

```json
{
  "questionId": "q_001",
  "answer": "C",
  "currentQuestionIndex": 4,
  "currentSection": 0
}
```

Alternative:

- support bulk autosave for the whole answer map

Minimum backend behavior:

- validate session state
- validate question belongs to the session
- store the answer
- reject writes after completion/expiry

### Advance section

#### `POST /api/candidate/sessions/:sessionId/advance-section`

Suggested request:

```json
{
  "nextSectionIndex": 1
}
```

This lets the backend reset section timing and lock the previous section.

### Complete test

#### `POST /api/candidate/sessions/:sessionId/complete`

Backend should:

1. close the session
2. compute section scores
3. compute total score
4. compute academic year
5. create the result record
6. return learner-safe result data

Suggested response:

```json
{
  "resultId": "res_001",
  "uin": "TRN-AB12CD",
  "name": "John",
  "surname": "Doe",
  "sectionResults": [
    { "section": "Course 1", "score": 7, "total": 10 },
    { "section": "Course 2", "score": 5, "total": 8 }
  ],
  "totalScore": 12,
  "totalQuestions": 18,
  "completedAt": "2026-04-13T13:10:00.000Z",
  "academicYear": "2025/2026",
  "status": "Pass",
  "percentage": 66.7
}
```

### Results and analytics

#### `GET /api/admin/results`

Supported query params:

- `search`
- `sortBy=date|score|name`
- `sortOrder=asc|desc`
- `academicYear`
- `page`
- `limit`

#### `GET /api/admin/results/:id`

Returns full per-section breakdown.

#### `GET /api/admin/analytics/academic-years`

Suggested response:

```json
[
  {
    "academicYear": "2025/2026",
    "totalTests": 120,
    "passed": 82,
    "failed": 38,
    "passRate": 68.3,
    "averageScore": 61.4
  }
]
```

## Recommended database model

Use normalized tables/collections rather than the current localStorage shape.

Suggested core entities:

- `admins`
- `subjects`
- `questions`
- `question_assets`
- `uins`
- `uin_subjects`
- `test_sessions`
- `test_session_questions`
- `test_session_answers`
- `test_results`
- `test_result_sections`

### Suggested relational outline

#### `subjects`

- `id`
- `name`
- `time_limit_seconds`
- `question_count`
- `is_active`
- `created_at`
- `updated_at`

#### `questions`

- `id`
- `subject_id`
- `question_text`
- `image_url`
- `option_a`
- `option_b`
- `option_c`
- `option_d`
- `correct_answer`
- `is_active`
- `created_at`
- `updated_at`

#### `uins`

- `id`
- `code`
- `is_used`
- `used_by_name`
- `used_by_surname`
- `used_at`
- `created_at`
- `status`

#### `uin_subjects`

- `uin_id`
- `subject_id`

#### `test_sessions`

- `id`
- `uin_id`
- `candidate_name`
- `candidate_surname`
- `status` (`active`, `completed`, `expired`, `abandoned`)
- `current_section_index`
- `current_question_index`
- `pending_section_index`
- `is_on_section_break`
- `started_at`
- `current_section_started_at`
- `completed_at`

#### `test_session_questions`

- `id`
- `session_id`
- `question_id`
- `subject_id`
- `section_order`
- `question_order`

Store the exact selected questions for that session so scoring is stable even if the question bank changes later.

#### `test_session_answers`

- `id`
- `session_id`
- `question_id`
- `answer`
- `saved_at`

#### `test_results`

- `id`
- `session_id`
- `uin_id`
- `candidate_name`
- `candidate_surname`
- `total_score`
- `total_questions`
- `percentage`
- `status`
- `academic_year`
- `completed_at`

#### `test_result_sections`

- `id`
- `result_id`
- `subject_id`
- `subject_name_snapshot`
- `score`
- `total`

## Backend validation rules

At minimum, validate:

- admin credentials and roles
- unique UIN code
- valid UIN format
- UIN not already used
- course names are unique
- question text is present
- all four options are present
- correct answer is one of `A`, `B`, `C`, `D`
- question count per course is not negative
- timer per course is positive
- enough active questions exist before a session is started
- submitted answer belongs to the learner's assigned session
- completion cannot happen twice

## Security and integrity requirements

This is the most important gap between the current frontend and production behavior.

The backend should enforce:

- real admin authentication
- hashed passwords
- secure session or JWT handling
- server-side authorization for admin endpoints
- atomic UIN consumption to prevent double-use race conditions
- server-side scoring
- server-side timer enforcement
- learner responses never receive the correct answer key
- audit logging for admin actions if possible

## Suggested handling for timer logic

Current UI logic tracks section timers per section and resets the timer when the learner moves into the next section.

Recommended backend rule:

- save `current_section_started_at`
- save `time_limit_seconds` snapshot per section for that session
- compute remaining time on the server when needed
- refuse answer saves or section moves when time has expired
- auto-complete or auto-advance according to product decision

## Suggested handling for question randomization

The frontend currently uses a deterministic seeded shuffle based on:

- UIN
- section name

Options for backend:

1. Keep deterministic selection so repeated validation produces the same session set
2. Generate once at session start and persist the selected question IDs

Option 2 is better for production. Persisting the exact question set is safer than recomputing later.

## Reporting requirements

The admin UI already expects:

- total tests
- available UIN count
- used UIN count
- question counts by course
- result search by learner name/surname/UIN
- sort by date, score, or learner name
- per-result section breakdown
- academic-year analytics
- exportable data

The backend does not need to generate browser-print HTML unless desired. Returning clean structured data is enough for the current UI to export on the client.

## Open decisions to confirm before implementation

These should be agreed before backend work begins:

1. Can a learner resume a test on another device, or only the original device?
2. Should UIN be marked used at test start or only after successful completion?
3. If a learner starts and abandons a test, can the same UIN be reopened?
4. Should "Courses per UIN" mean:
   - same fixed set for every generated UIN
   - random subset per generated UIN
   - manually assigned subjects per UIN
5. Should learners see results immediately after submission?
6. Should admins be able to edit questions after a session has already used them?
7. Should deleted courses/questions remain in historical reporting?
8. Should image uploads be stored locally, in object storage, or via a media service?

## Recommended implementation order

1. Admin auth
2. Subjects API
3. Questions API and image upload
4. UIN generation and retrieval
5. Candidate session start/resume/save/complete
6. Results and analytics endpoints
7. Replace frontend `storage.ts` calls with API service calls

## Frontend integration note

When backend work begins, the easiest frontend migration path is:

1. keep the current UI as-is
2. replace functions in `src/utils/storage.ts`
3. move session creation/scoring logic out of local code and into API calls
4. keep temporary local caching only as a resilience layer, not as the source of truth

## Final recommendation

Build the backend so that:

- the server owns exam state
- the server owns correctness and scoring
- the server owns UIN validity and consumption
- the frontend becomes a presentation layer plus temporary client cache

That architecture will match the current UI while making the CBT system safe enough for real use.
