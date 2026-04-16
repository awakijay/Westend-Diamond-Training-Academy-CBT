# Decisions To Confirm

These points already exist as hidden product decisions in the current frontend. The backend developer should confirm them before implementation is finalized.

## 1. UIN lifecycle

- Should a UIN become fully `USED` at session start, or first become `LOCKED` and only switch to `USED` after completion?
- If a learner abandons a test, can the same UIN ever be reopened?

Recommended default:
- mark as `LOCKED` at session start
- mark as `USED` at successful completion
- keep abandoned sessions reviewable by admin

## 2. Resume behavior

- Can a learner resume only on the same device, or on any device with verified session access?

Recommended default:
- allow resume by `sessionId` with server-side session state

## 3. Courses per UIN

The current frontend says "Courses per UIN" but actually assigns the first selected `N` courses to every generated UIN.

Choose one rule:
- same fixed subset for every generated UIN
- random subset per generated UIN
- manual assignment per generated UIN

Recommended default:
- same fixed subset for every batch until the product owner says otherwise

## 4. Question edits after use

- Can admins edit questions that already appeared in completed sessions?

Recommended default:
- yes, but only future sessions should use the new version
- completed sessions should rely on stored snapshots

## 5. Subject and question deletion

- Should delete mean hard delete, soft delete, or deactivate?

Recommended default:
- soft delete or deactivate only

## 6. Candidate results visibility

- Should learners see results immediately after submission?

Recommended default:
- yes, if the current UI behavior is being preserved

## 7. Auto-submit behavior

- When section time expires, should the backend auto-advance to the next section or move the learner to a break screen first?

Recommended default:
- preserve the current frontend flow: finish section, show break, then continue

## 8. Image storage

- Should question images live on local disk, S3-compatible object storage, or a media service?

Recommended default:
- object storage or media service

