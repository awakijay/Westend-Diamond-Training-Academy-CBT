import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { LayoutDashboard, FileQuestion, Ticket, BarChart3, LogOut } from 'lucide-react';
import logo from '../../assets/wednl-banner1-3.png';
import { clearAdminSession, getAdminToken } from '../../utils/clientState';
import { getAdminMe, logoutAdmin } from '../../utils/api';
import type { AdminProfile } from '../../types';
import ThemeToggle from './ThemeToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!getAdminToken()) {
        clearAdminSession();
        navigate('/admin');
        return;
      }

      try {
        const currentAdmin = await getAdminMe();
        setAdmin(currentAdmin);
      } catch {
        clearAdminSession();
        navigate('/admin');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void verifyAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch {
      // Local logout should still succeed if the server session already expired.
    } finally {
      clearAdminSession();
      navigate('/admin');
    }
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/questions', icon: FileQuestion, label: 'Questions' },
    { path: '/admin/uin', icon: Ticket, label: 'UIN Generator' },
    { path: '/admin/results', icon: BarChart3, label: 'Results' },
  ];

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_35%),linear-gradient(180deg,#020617_0%,#111827_100%)]">
        <div className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Checking admin session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_35%),linear-gradient(180deg,#020617_0%,#111827_100%)] dark:text-slate-100">
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="Westend Diamond Training Academy"
              className="h-12 w-auto rounded-lg mr-6"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Administration
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Westend Diamond Training Academy CBT
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:block dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              {admin ? `Signed in as ${admin.name}` : 'Secure school control panel'}
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/70 bg-white/75 p-2 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-[0_20px_60px_-35px_rgba(8,145,178,0.35)]">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-cyan-500 dark:text-slate-950 dark:shadow-cyan-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
