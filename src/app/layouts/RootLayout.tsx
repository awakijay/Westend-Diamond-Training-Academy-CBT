import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { getHealth } from '../../utils/api';
import { syncClientDataVersion } from '../../utils/clientState';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncDataVersion = async () => {
      try {
        const health = await getHealth();
        syncClientDataVersion(health.dataVersion);
      } catch {
        // Individual pages already handle backend availability states.
      } finally {
        setIsReady(true);
      }
    };

    void syncDataVersion();
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 text-sm text-slate-500 dark:bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] dark:text-slate-400">
        Preparing the latest exam data...
      </div>
    );
  }

  return <Outlet />;
}
