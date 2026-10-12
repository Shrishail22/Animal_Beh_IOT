import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import AnimalDetails from './pages/AnimalDetails';
import LiveMonitoring from './pages/LiveMonitoring';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Devices from './pages/Devices';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#102a43',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Dashboard layout */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="animals" element={<Animals />} />
          <Route path="animals/:id" element={<AnimalDetails />} />
          <Route path="monitoring" element={<LiveMonitoring />} />
          <Route path="behavior" element={<BehaviorAnalysis />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="devices" element={<Devices />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
