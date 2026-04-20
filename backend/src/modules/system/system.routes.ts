import { Router } from 'express';
import { restoreDefaultBodySchema } from './system.schema.js';
import { validate } from '../../common/validation/validate.js';
import { clearAllUploadedFiles } from '../../common/utils/upload-files.js';
import { generateId, mutateStore } from '../../lib/store.js';

const router = Router();

router.post('/restore-default', validate({ body: restoreDefaultBodySchema }), async (_req, res) => {
  const summary = await mutateStore((store) => {
    const response = {
      auditLogsCleared: store.auditLogs.length,
      questionsCleared: store.questions.length,
      resultsCleared: store.results.length,
      sessionsCleared: store.sessions.length,
      subjectsCleared: store.subjects.length,
      uinsCleared: store.uins.length,
    };

    store.subjects = [];
    store.questions = [];
    store.uins = [];
    store.uinSubjects = [];
    store.sessions = [];
    store.sessionSections = [];
    store.sessionQuestions = [];
    store.sessionAnswers = [];
    store.results = [];
    store.resultSections = [];
    store.auditLogs = [];
    store.meta.dataVersion = generateId();

    return {
      ...response,
      dataVersion: store.meta.dataVersion,
    };
  });

  let warning: string | null = null;
  let uploadFilesCleared = 0;

  try {
    uploadFilesCleared = await clearAllUploadedFiles();
  } catch {
    warning =
      'Data was reset successfully, but one or more uploaded question images could not be deleted.';
  }

  res.json({
    dataVersion: summary.dataVersion,
    message:
      'Default data restored. Courses, questions, UINs, sessions, results, and cached exam data are ready for a fresh production setup.',
    summary: {
      auditLogsCleared: summary.auditLogsCleared,
      questionsCleared: summary.questionsCleared,
      resultsCleared: summary.resultsCleared,
      sessionsCleared: summary.sessionsCleared,
      subjectsCleared: summary.subjectsCleared,
      uinsCleared: summary.uinsCleared,
      uploadFilesCleared,
    },
    warning,
  });
});

export default router;
