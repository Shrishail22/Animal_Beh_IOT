import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, Activity, Brain, Bell, FileBarChart,
  Cpu, LogOut, ChevronLeft, ChevronRight, Menu,
} from 'lucide-react';

import { logoutUser } from '../services/authService';

const navItems = [
  { to: '/',              label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/animals',       label: 'Animals',            icon: PawPrint },
  { to: '/monitoring',    label: 'Live Monitoring',    icon: Activity },
  { to: '/behavior',      label: 'Behavioral Analysis',icon: Brain },
  { to: '/alerts',        label: 'Alerts',             icon: Bell },
  { to: '/reports',       label: 'Reports',            icon: FileBarChart },
  { to: '/devices',       label: 'Device Management',  icon: Cpu },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-navy-950 text-white transition-all duration-300 ${
          collapsed ? 'w-[70px]' : 'w-64'
        } lg:relative`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-navy-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">AnimalWatch</h1>
              <p className="text-[10px] text-navy-400 truncate">IoT Monitoring</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-300'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-1 flex-shrink-0 border-t border-navy-800 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-red-600/20 hover:text-red-300 w-full transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-400 hover:bg-navy-800 hover:text-white w-full transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
