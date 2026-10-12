import { useState, useEffect, useMemo } from 'react';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Clock,
  Filter, Check, Eye, X, User, ExternalLink, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import DataTable from '../components/DataTable';
import { getAlerts, acknowledgeAlert } from '../services/alertService';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, acknowledged
  const [dateFilter, setDateFilter] = useState('all');     // all, 24h, 3d, 7d
  const [search, setSearch] = useState('');

  // Selected for detail modal
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId, e) => {
    if (e) e.stopPropagation();
    try {
      const userObj = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userName = (userObj.name && userObj.name !== 'Dr. Sarah Mitchell') ? userObj.name : 'Shirshail';
      await acknowledgeAlert(alertId, userName);
      toast.success('Alert marked as acknowledged.');
      // Update local state
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                acknowledged: true,
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: userName,
              }
            : a
        )
      );
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert((prev) => ({
          ...prev,
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: userName,
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to acknowledge alert');
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    const now = new Date().getTime();
    return alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (statusFilter === 'pending' && a.acknowledged) return false;
      if (statusFilter === 'acknowledged' && !a.acknowledged) return false;

      // Date filtering
      if (dateFilter !== 'all') {
        const alertTime = new Date(a.timestamp).getTime();
        const diffHours = (now - alertTime) / (1000 * 60 * 60);
        if (dateFilter === '24h' && diffHours > 24) return false;
        if (dateFilter === '3d' && diffHours > 72) return false;
        if (dateFilter === '7d' && diffHours > 168) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.animalName.toLowerCase().includes(q) ||
          a.animalId.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, typeFilter, statusFilter, dateFilter, search]);

  // Aggregate stats
  const totalCritical = alerts.filter((a) => a.severity === 'critical').length;
  const totalWarning = alerts.filter((a) => a.severity === 'warning').length;
  const pendingCount = alerts.filter((a) => !a.acknowledged).length;
  const acknowledgedCount = alerts.filter((a) => a.acknowledged).length;

  const alertTypes = Array.from(new Set(alerts.map((a) => a.type)));

  // DataTable column definitions with built-in sorting & pagination
  const columns = [
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'title',
      label: 'Alert Title & Summary',
      sortable: true,
      render: (v, row) => (
        <div className="max-w-xs md:max-w-md">
          <p className="font-semibold text-gray-900 truncate">{v}</p>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'animalName',
      label: 'Animal',
      sortable: true,
      render: (v, row) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/animals/${row.animalId}`);
          }}
          className="font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {v} <span className="text-xs text-gray-400">({row.animalId})</span>
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (v) => (
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
          {v}
        </span>
      ),
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(v).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'acknowledged',
      label: 'Status',
      sortable: true,
      render: (v) =>
        v ? (
          <span className="badge-green inline-flex items-center gap-1">
            <Check className="w-3 h-3" /> Acknowledged
          </span>
        ) : (
          <span className="badge-yellow inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {!row.acknowledged && (
            <button
              onClick={(e) => handleAcknowledge(row.id, e)}
              className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1"
              title="Acknowledge Alert"
            >
              <Check className="w-3.5 h-3.5" /> Ack
            </button>
          )}
          <button
            onClick={() => setSelectedAlert(row)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Attention"
          value={pendingCount}
          subtitle="Unacknowledged alerts"
          icon={<AlertCircle className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Critical Severity"
          value={totalCritical}
          subtitle="High urgency events"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="amber"
        />
        <StatCard
          title="Warnings & Notices"
          value={totalWarning}
          subtitle="Elevated thresholds"
          icon={<Info className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Acknowledged"
          value={acknowledgedCount}
          subtitle="Resolved / Handled"
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
      </div>

      {/* Filter toolbar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="select-field text-sm w-auto"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select-field text-sm w-auto"
            >
              <option value="all">All Alert Types</option>
              {alertTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field text-sm w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="select-field text-sm w-auto"
            >
              <option value="all">All Dates</option>
              <option value="24h">Past 24 Hours</option>
              <option value="3d">Past 3 Days</option>
              <option value="7d">Past 7 Days</option>
            </select>
          </div>

          {(severityFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSeverityFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="btn-ghost text-xs text-gray-500 hover:text-gray-800"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Paginated Alerts DataTable */}
      <LoadingState
        loading={loading}
        error={error}
        empty={filteredAlerts.length === 0}
        emptyMessage="No alerts match the selected filters."
      >
        <div className="card p-5">
          <DataTable
            columns={columns}
            data={filteredAlerts}
            searchable
            searchPlaceholder="Search alert by keyword, animal or ID…"
            searchKeys={['title', 'description', 'animalName', 'animalId', 'type']}
            pageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            onRowClick={(row) => setSelectedAlert(row)}
            emptyMessage="No alerts available."
          />
        </div>
      </LoadingState>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedAlert(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={selectedAlert.severity} />
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                    {selectedAlert.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-navy-900">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-700 leading-relaxed text-sm">
                {selectedAlert.description}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-gray-400 block">Alert ID</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedAlert.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Animal</span>
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      navigate(`/animals/${selectedAlert.animalId}`);
                    }}
                    className="font-semibold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    {selectedAlert.animalName} ({selectedAlert.animalId})
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <span className="text-gray-400 block">Timestamp</span>
                  <span className="text-gray-800">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Current Status</span>
                  {selectedAlert.acknowledged ? (
                    <span className="text-emerald-700 font-semibold">Acknowledged</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Pending Action</span>
                  )}
                </div>
              </div>

              {selectedAlert.acknowledged && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Acknowledged by: {selectedAlert.acknowledgedBy || 'Supervisor'}
                  </p>
                  <p className="text-emerald-700">
                    Resolved at: {new Date(selectedAlert.acknowledgedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {!selectedAlert.acknowledged ? (
                <button
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Mark as Acknowledged
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedAlert(null)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
