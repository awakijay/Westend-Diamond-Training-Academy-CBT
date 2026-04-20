import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import adminAuthRoutes from '../modules/admin-auth/admin-auth.routes.js';
import subjectRoutes from '../modules/subjects/subjects.routes.js';
import publicSubjectRoutes from '../modules/subjects/subjects.public.routes.js';
import questionRoutes from '../modules/questions/questions.routes.js';
import uploadRoutes from '../modules/uploads/uploads.routes.js';
import uinRoutes from '../modules/uins/uins.routes.js';
import candidateSessionRoutes from '../modules/candidate-sessions/candidate-sessions.routes.js';
import resultRoutes from '../modules/results/results.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import systemRoutes from '../modules/system/system.routes.js';
import { requireAdminAuth } from '../common/middleware/require-admin-auth.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/admin/auth', adminAuthRoutes);
apiRouter.use('/candidate/subjects', publicSubjectRoutes);
apiRouter.use('/admin/subjects', requireAdminAuth, subjectRoutes);
apiRouter.use('/admin/questions', requireAdminAuth, questionRoutes);
apiRouter.use('/admin/uploads', requireAdminAuth, uploadRoutes);
apiRouter.use('/admin/uins', requireAdminAuth, uinRoutes);
apiRouter.use('/candidate/sessions', candidateSessionRoutes);
apiRouter.use('/admin/results', requireAdminAuth, resultRoutes);
apiRouter.use('/admin/analytics', requireAdminAuth, analyticsRoutes);
apiRouter.use('/admin/system', requireAdminAuth, systemRoutes);
