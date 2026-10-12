import { useMemo } from 'react';

/**
 * Reusable stat card for dashboard and summary pages.
 *
 * @param {{ title: string, value: string|number, subtitle?: string, icon: React.ReactNode, trend?: string, trendUp?: boolean, color?: string }} props
 */
export default function StatCard({ title, value, subtitle, icon, trend, trendUp, color = 'teal' }) {
  const colorMap = useMemo(() => ({
    teal:   { bg: 'bg-teal-50',    icon: 'text-teal-600',    border: 'border-teal-200' },
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-200' },
    amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-200' },
    red:    { bg: 'bg-red-50',     icon: 'text-red-600',     border: 'border-red-200' },
    green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600',  border: 'border-purple-200' },
    gray:   { bg: 'bg-gray-50',    icon: 'text-gray-600',    border: 'border-gray-200' },
  }), []);

  const c = colorMap[color] || colorMap.teal;

  return (
    <div className={`card p-5 flex items-start gap-4 animate-fade-in border-l-4 ${c.border}`}>
      <div className={`flex-shrink-0 p-3 rounded-xl ${c.bg}`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-navy-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
