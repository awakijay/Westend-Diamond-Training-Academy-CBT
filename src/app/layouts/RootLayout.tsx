import { Outlet } from 'react-router';
import { useEffect } from 'react';
import { initializeMockData } from '../../utils/mockData';

export default function RootLayout() {
  useEffect(() => {
    initializeMockData();
  }, []);

  return <Outlet />;
}
