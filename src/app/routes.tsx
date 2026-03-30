import { createHashRouter } from 'react-router';
import LandingPage from './pages/LandingPage.tsx';
import TestPage from './pages/TestPage.tsx';
import ResultsPage from './pages/ResultsPage.tsx';
import AdminLogin from './pages/admin/AdminLogin.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminQuestions from './pages/admin/AdminQuestions.tsx';
import AdminUINGenerator from './pages/admin/AdminUINGenerator.tsx';
import AdminResults from './pages/admin/AdminResults.tsx';
import RootLayout from './layouts/RootLayout.tsx';

export const router = createHashRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: 'test', Component: TestPage },
      { path: 'results', Component: ResultsPage },
      { path: 'admin', Component: AdminLogin },
      { path: 'admin/dashboard', Component: AdminDashboard },
      { path: 'admin/questions', Component: AdminQuestions },
      { path: 'admin/uin', Component: AdminUINGenerator },
      { path: 'admin/results', Component: AdminResults },
    ],
  },
]);
