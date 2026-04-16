import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import adminAuthRoutes from '../modules/admin-auth/admin-auth.routes.js';
import subjectRoutes from '../modules/subjects/subjects.routes.js';
import questionRoutes from '../modules/questions/questions.routes.js';
import uploadRoutes from '../modules/uploads/uploads.routes.js';
import uinRoutes from '../modules/uins/uins.routes.js';
import candidateSessionRoutes from '../modules/candidate-sessions/candidate-sessions.routes.js';
import resultRoutes from '../modules/results/results.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/admin/auth', adminAuthRoutes);
apiRouter.use('/admin/subjects', subjectRoutes);
apiRouter.use('/admin/questions', questionRoutes);
apiRouter.use('/admin/uploads', uploadRoutes);
apiRouter.use('/admin/uins', uinRoutes);
apiRouter.use('/candidate/sessions', candidateSessionRoutes);
apiRouter.use('/admin/results', resultRoutes);
apiRouter.use('/admin/analytics', analyticsRoutes);

