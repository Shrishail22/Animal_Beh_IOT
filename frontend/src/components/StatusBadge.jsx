/**
 * Reusable status badge component.
 * Maps a status string to color styling.
 */
export default function StatusBadge({ status, size = 'sm' }) {
  const map = {
    // General
    online:      { label: 'Online',      cls: 'badge-green' },
    offline:     { label: 'Offline',     cls: 'badge-gray' },
    warning:     { label: 'Warning',     cls: 'badge-yellow' },
    // Animal statuses
    monitored:   { label: 'Monitored',   cls: 'badge-green' },
    normal:      { label: 'Normal',      cls: 'badge-blue' },
    alert:       { label: 'Alert',       cls: 'badge-red' },
    // Alert severities
    critical:    { label: 'Critical',    cls: 'badge-red' },
    info:        { label: 'Info',        cls: 'badge-blue' },
    // Acknowledged
    acknowledged: { label: 'Acknowledged', cls: 'badge-green' },
    pending:      { label: 'Pending',      cls: 'badge-yellow' },
  };

  const s = map[status?.toLowerCase()] || { label: status, cls: 'badge-gray' };
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1' : '';

  return (
    <span className={`${s.cls} ${sizeClass}`}>
      {s.label}
    </span>
  );
}
