import { useState, useEffect, useMemo } from 'react';
import {
  Cpu, Plus, Edit, Link, Unlink, Wifi, WifiOff, AlertTriangle,
  BatteryCharging, Battery, Search, X, Check, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getDevices, createDevice, updateDevice, assignDevice, unassignDevice
} from '../services/deviceService';
import { getAnimals } from '../services/animalService';

const DEVICE_TYPES = ['Collar Sensor', 'Leg Band', 'Ear Tag Sensor', 'Belly Band'];
const SENSOR_CAPABILITIES = [
  'Temperature, Accelerometer',
  'Accelerometer, Heart Rate',
  'Temperature, GPS',
  'Temperature, Accelerometer, Heart Rate',
];

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals state
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deviceToAssign, setDeviceToAssign] = useState(null);
  const [selectedAnimalForAssign, setSelectedAnimalForAssign] = useState('');

  const [confirmUnassign, setConfirmUnassign] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchDeviceList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [devRes, anmRes] = await Promise.all([getDevices(), getAnimals()]);
      setDevices(devRes.data || []);
      setAnimals(anmRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch device registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceList();
  }, []);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      return true;
    });
  }, [devices, statusFilter, typeFilter]);

  // Aggregate stats
  const totalCount = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const assignedCount = devices.filter((d) => d.assignedAnimalId).length;

  // Save Add/Edit
  const handleSaveDevice = async (formData) => {
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, formData);
        toast.success(`Device ${editingDevice.id} updated.`);
      } else {
        const res = await createDevice(formData);
        toast.success(`Registered device ${res.data.id}.`);
      }
      setShowDeviceModal(false);
      setEditingDevice(null);
      fetchDeviceList();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  // Assign device
  const handleAssignConfirm = async () => {
    if (!deviceToAssign || !selectedAnimalForAssign) {
      toast.error('Select an animal to assign');
      return;
    }
    const animal = animals.find((a) => a.id === selectedAnimalForAssign);
    try {
      await assignDevice(deviceToAssign.id, animal.id, animal.name);
      toast.success(`Assigned ${deviceToAssign.name} to ${animal.name}`);
      setShowAssignModal(false);
      setDeviceToAssign(null);
      setSelectedAnimalForAssign('');
      fetchDeviceList();
    } catch (err) {
      toast.error(err.message || 'Assignment failed');
    }
  };

  // Unassign device
  const handleUnassignConfirm = async () => {
    if (!confirmUnassign) return;
    try {
      await unassignDevice(confirmUnassign.id);
      toast.success(`Unassigned device ${confirmUnassign.id}`);
      setConfirmUnassign(null);
      fetchDeviceList();
    } catch (err) {
      toast.error(err.message || 'Unassign failed');
    }
  };

  // Delete device
  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    setDevices((prev) => prev.filter((d) => d.id !== confirmDelete.id));
    toast.success(`Device ${confirmDelete.id} decommissioned.`);
    setConfirmDelete(null);
  };

  // DataTable columns with sorting and actions
  const columns = [
    {
      key: 'name',
      label: 'Device Label & ID',
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{v}</p>
            <p className="text-xs font-mono text-gray-400">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Form Factor',
      sortable: true,
      render: (v) => <span className="font-medium text-gray-700">{v}</span>,
    },
    {
      key: 'sensorType',
      label: 'Sensor Package',
      sortable: true,
      render: (v) => <span className="text-xs text-gray-500">{v}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'batteryLevel',
      label: 'Battery Level',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                v > 50 ? 'bg-emerald-500' : v > 20 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700">{v}%</span>
        </div>
      ),
    },
    {
      key: 'assignedAnimalName',
      label: 'Assigned Animal',
      sortable: true,
      render: (v, row) =>
        row.assignedAnimalId ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-semibold">
            {v}
            <span className="text-[10px] text-teal-600">({row.assignedAnimalId})</span>
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        ),
    },
    {
      key: 'lastCommunication',
      label: 'Last Sync',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {v ? new Date(v).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.assignedAnimalId ? (
            <button
              onClick={() => setConfirmUnassign(row)}
              className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors"
              title="Unassign Device from Animal"
            >
              <Unlink className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setDeviceToAssign(row);
                setSelectedAnimalForAssign(mockAnimals[0]?.id || '');
                setShowAssignModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-teal-600 rounded hover:bg-teal-50 transition-colors"
              title="Pair with Animal"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              setEditingDevice(row);
              setShowDeviceModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="Edit Hardware Spec"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            title="Decommission Hardware"
          >
            <Trash2 className="w-4 h-4" />
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
          title="Total IoT Hardware"
          value={totalCount}
          subtitle="Registered in fleet"
          icon={<Cpu className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Online & Transmitting"
          value={onlineCount}
          subtitle="Heartbeat verified"
          icon={<Wifi className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Offline Devices"
          value={offlineCount}
          subtitle="Power off or out of range"
          icon={<WifiOff className="w-6 h-6" />}
          color="gray"
        />
        <StatCard
          title="Paired with Livestock"
          value={`${assignedCount} / ${totalCount}`}
          subtitle="Currently deployed on animals"
          icon={<Link className="w-6 h-6" />}
          color="teal"
        />
      </div>

      {/* Filter and Add Toolbar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field text-sm w-auto"
          >
            <option value="all">All Connection States</option>
            <option value="online">Online</option>
            <option value="warning">Warning / Low Battery</option>
            <option value="offline">Offline</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-field text-sm w-auto"
          >
            <option value="all">All Form Factors</option>
            {DEVICE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {(statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="btn-ghost text-xs text-gray-500 hover:text-gray-800"
            >
              Reset Filters
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setEditingDevice(null);
            setShowDeviceModal(true);
          }}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Register New Device
        </button>
      </div>

      {/* Paginated Device Registry Table */}
      <LoadingState
        loading={loading}
        error={error}
        empty={filteredDevices.length === 0}
        emptyMessage="No IoT devices matched your criteria."
      >
        <div className="card p-5">
          <DataTable
            columns={columns}
            data={filteredDevices}
            searchable
            searchPlaceholder="Search devices by ID, label, form factor, or animal…"
            searchKeys={['id', 'name', 'type', 'sensorType', 'assignedAnimalName']}
            pageSize={10}
            pageSizeOptions={[5, 10, 20]}
            emptyMessage="No devices available."
          />
        </div>
      </LoadingState>

      {/* Add / Edit Device Modal */}
      {showDeviceModal && (
        <DeviceFormModal
          device={editingDevice}
          onClose={() => {
            setShowDeviceModal(false);
            setEditingDevice(null);
          }}
          onSave={handleSaveDevice}
        />
      )}

      {/* Assign Device Modal */}
      {showAssignModal && deviceToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-navy-900">Pair Device to Livestock</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Attach hardware <strong>{deviceToAssign.name} ({deviceToAssign.id})</strong> to an animal:
            </p>

            <div>
              <label className="label">Registered Animal</label>
              <select
                value={selectedAnimalForAssign}
                onChange={(e) => setSelectedAnimalForAssign(e.target.value)}
                className="select-field text-sm"
              >
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.species} ({a.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignConfirm}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmUnassign)}
        title="Unpair IoT Device"
        message={`Are you sure you want to unassign ${confirmUnassign?.name} from ${confirmUnassign?.assignedAnimalName}?`}
        confirmLabel="Unassign Device"
        variant="danger"
        onConfirm={handleUnassignConfirm}
        onCancel={() => setConfirmUnassign(null)}
      />

      {/* Decommission Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Decommission Hardware"
        message={`Are you sure you want to decommission ${confirmDelete?.name} (${confirmDelete?.id})? This will delete the device record.`}
        confirmLabel="Decommission"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/* ── Device Add/Edit Modal ──────────────────────────────────────────────── */
function DeviceFormModal({ device, onClose, onSave }) {
  const [form, setForm] = useState({
    name: device?.name || '',
    type: device?.type || DEVICE_TYPES[0],
    sensorType: device?.sensorType || SENSOR_CAPABILITIES[0],
    firmwareVersion: device?.firmwareVersion || '2.1.4',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Device label is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-navy-900">
            {device ? `Edit Device (${device.id})` : 'Register IoT Device'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Device Name / Label *</label>
            <input
              type="text"
              placeholder="e.g. Smart Collar Beta"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="label">Form Factor / Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="select-field"
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Sensor Package Capability</label>
            <select
              value={form.sensorType}
              onChange={(e) => setForm({ ...form, sensorType: e.target.value })}
              className="select-field"
            >
              {SENSOR_CAPABILITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Firmware Version</label>
            <input
              type="text"
              value={form.firmwareVersion}
              onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm">
              {device ? 'Save Changes' : 'Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
