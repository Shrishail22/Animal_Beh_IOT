import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getAlerts } from '../services/alertService';

const pageTitles = {
  '/':            'Dashboard',
  '/animals':     'Animal Management',
  '/monitoring':  'Live Sensor Monitoring',
  '/behavior':    'Behavioral Analysis',
  '/alerts':      'Alerts & Notifications',
  '/reports':     'Reports & Analytics',
  '/devices':     'Device Management',
};

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState(0);
  const location = useLocation();

  // Auth guard — check session
  const token = sessionStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => {
    async function loadAlertCount() {
      try {
        const { data } = await getAlerts();
        const unacked = (data || []).filter((a) => !a.acknowledged).length;
        setUnacknowledgedAlerts(unacked);
      } catch (err) {
        console.warn('Failed to load alert counter:', err.message);
      }
    }
    loadAlertCount();
  }, [location.pathname]);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const pathBase = '/' + (pathParts[0] || '');
  const title = pageTitles[pathBase] || 'AnimalWatch';

  let breadcrumb = 'Home';
  if (pathParts.length === 1) {
    breadcrumb = `Home / ${pageTitles['/' + pathParts[0]] || pathParts[0]}`;
  } else if (pathParts.length > 1) {
    breadcrumb = `Home / ${pageTitles['/' + pathParts[0]] || pathParts[0]} / ${pathParts.slice(1).join(' / ')}`;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block print:w-full">
        <div className="print:hidden">
          <Navbar
            title={title}
            breadcrumb={breadcrumb}
            alertCount={unacknowledgedAlerts}
            onMenuClick={() => setSidebarCollapsed((c) => !c)}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 print:overflow-visible print:h-auto print:p-0 print:block print:w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
