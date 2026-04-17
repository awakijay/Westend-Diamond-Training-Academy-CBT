import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, AlertCircle, ArrowLeft, LockKeyhole, LayoutDashboard } from 'lucide-react';
import { ApiError, getAdminMe, loginAdmin } from '../../../utils/api';
import { getAdminToken, setAdminSession } from '../../../utils/clientState';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const restoreAdmin = async () => {
      if (!getAdminToken()) {
        return;
      }

      try {
        await getAdminMe();
        navigate('/admin/dashboard');
      } catch {
        // Let the user sign in again if the token is stale.
      }
    };

    void restoreAdmin();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginAdmin(credentials);
      setAdminSession(response.token, response.admin);
      navigate('/admin/dashboard');
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to sign in right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#334155_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-slate-100 backdrop-blur-xl">
            <Shield className="h-4 w-4 text-cyan-300" />
            Secure Admin Access
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Manage the CBT system with a cleaner control experience.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-200">
              Access the dashboard to manage questions, generate UINs, and review completed
              tests from one organized admin workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <LayoutDashboard className="h-6 w-6 text-cyan-300" />
              <p className="mt-4 text-sm font-semibold">Central Dashboard</p>
              <p className="mt-2 text-sm text-slate-200">Track questions, UINs, and results at a glance.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <LockKeyhole className="h-6 w-6 text-amber-300" />
              <p className="mt-4 text-sm font-semibold">Protected Access</p>
              <p className="mt-2 text-sm text-slate-200">Only authenticated administrators can continue.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-3xl border border-white/10 bg-white/10 p-5 text-left backdrop-blur-xl transition hover:bg-white/15"
            >
              <ArrowLeft className="h-6 w-6 text-emerald-300" />
              <p className="mt-4 text-sm font-semibold">Back to Student Portal</p>
              <p className="mt-2 text-sm text-slate-200">Return to the candidate entry experience.</p>
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.8)] md:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              Admin Portal
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage the CBT platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm text-slate-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(event) =>
                  setCredentials({ ...credentials, username: event.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials({ ...credentials, password: event.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing In...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
            <p className="font-semibold">Default Seed Credentials</p>
            <p className="mt-2">Username: admin</p>
            <p>Password: admin123</p>
          </div>
        </section>
      </div>
    </div>
  );
}
