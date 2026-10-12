import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Top navigation bar with page title, notifications, and user profile.
 */
export default function Navbar({ title, breadcrumb, onMenuClick, alertCount = 0 }) {
  const navigate = useNavigate();
  const rawUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const user = {
    ...rawUser,
    name: rawUser.name && rawUser.name !== 'Dr. Sarah Mitchell' ? rawUser.name : 'Shirshail',
    role: rawUser.role || 'Farm Administrator',
  };
  if (rawUser.name === 'Dr. Sarah Mitchell') {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          {breadcrumb && (
            <p className="text-xs text-gray-400 truncate">{breadcrumb}</p>
          )}
          <h2 className="text-lg font-semibold text-navy-900 truncate">{title}</h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="View alerts"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-dot">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
            {(user.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user.name || 'Shirshail'}</p>
            <p className="text-xs text-gray-400 truncate">{user.role || 'Farm Administrator'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
