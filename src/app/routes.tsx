import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { createHashRouter } from 'react-router';
import RootLayout from './layouts/RootLayout.tsx';

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const TestPage = lazy(() => import('./pages/TestPage.tsx'));
const ResultsPage = lazy(() => import('./pages/ResultsPage.tsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions.tsx'));
const AdminUINGenerator = lazy(() => import('./pages/admin/AdminUINGenerator.tsx'));
const AdminResults = lazy(() => import('./pages/admin/AdminResults.tsx'));

const withPageLoader = (Page: LazyExoticComponent<ComponentType>) => (
  <Suspense
    fallback={
      <div className="flex min-h-[60vh] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 text-sm text-slate-500">
        Loading page...
      </div>
    }
  >
    <Page />
  </Suspense>
);

export const router = createHashRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, element: withPageLoader(LandingPage) },
      { path: 'test', element: withPageLoader(TestPage) },
      { path: 'results', element: withPageLoader(ResultsPage) },
      { path: 'admin', element: withPageLoader(AdminLogin) },
      { path: 'admin/dashboard', element: withPageLoader(AdminDashboard) },
      { path: 'admin/questions', element: withPageLoader(AdminQuestions) },
      { path: 'admin/uin', element: withPageLoader(AdminUINGenerator) },
      { path: 'admin/results', element: withPageLoader(AdminResults) },
    ],
  },
]);
