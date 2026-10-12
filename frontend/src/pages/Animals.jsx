import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getAnimals, createAnimal, updateAnimal, deleteAnimal
} from '../services/animalService';
import { getDevices } from '../services/deviceService';
import { speciesList } from '../mock/mockData';

export default function Animals() {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [animalToDelete, setAnimalToDelete] = useState(null);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      setError(null);
      const [anmRes, devRes] = await Promise.all([getAnimals(), getDevices()]);
      setAnimals(anmRes.data || []);
      setDevices(devRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load animals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const filteredAnimals = animals.filter((a) => {
    if (filterSpecies !== 'all' && a.species !== filterSpecies) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!animalToDelete) return;
    try {
      await deleteAnimal(animalToDelete.id);
      toast.success(`Animal ${animalToDelete.name} (${animalToDelete.id}) removed.`);
      setAnimalToDelete(null);
      fetchAnimals();
    } catch (err) {
      toast.error(err.message || 'Failed to delete animal');
    }
  };

  const columns = [
    { key: 'id', label: 'Animal ID', sortable: true },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (v) => <span className="font-semibold text-navy-900">{v}</span>,
    },
    { key: 'species', label: 'Species', sortable: true },
    { key: 'breed', label: 'Breed', sortable: true },
    {
      key: 'age',
      label: 'Age',
      sortable: true,
      render: (v) => `${v} yrs`,
    },
    { key: 'sex', label: 'Sex' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'deviceId',
      label: 'Assigned Device',
      render: (v) =>
        v ? (
          <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
            {v}
          </span>
        ) : (
          <span className="text-gray-400 text-xs italic">Unassigned</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/animals/${row.id}`)}
            className="p-1.5 text-gray-400 hover:text-teal-600 rounded hover:bg-teal-50 transition-colors"
            title="View Details & Profile"
            aria-label="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditAnimal(row);
              setShowForm(true);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="Edit Details"
            aria-label="Edit animal"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAnimalToDelete(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            title="Delete Record"
            aria-label="Delete animal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="select-field w-auto text-sm"
          >
            <option value="all">All Species</option>
            {speciesList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-field w-auto text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="monitored">Monitored</option>
            <option value="normal">Normal</option>
            <option value="alert">Alert</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditAnimal(null);
            setShowForm(true);
          }}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Register Animal
        </button>
      </div>

      <LoadingState
        loading={loading}
        error={error}
        empty={filteredAnimals.length === 0}
        emptyMessage="No animals match the current filter selection."
      >
        <DataTable
          columns={columns}
          data={filteredAnimals}
          searchable
          searchPlaceholder="Search by ID, name, species, or breed…"
          searchKeys={['id', 'name', 'species', 'breed', 'identificationNumber']}
          onRowClick={(row) => navigate(`/animals/${row.id}`)}
          pageSize={10}
          pageSizeOptions={[5, 10, 20]}
        />
      </LoadingState>

      {/* Add / Edit Modal */}
      {showForm && (
        <AnimalFormModal
          animal={editAnimal}
          devices={devices}
          onClose={() => {
            setShowForm(false);
            setEditAnimal(null);
          }}
          onSave={async (data) => {
            try {
              if (editAnimal) {
                await updateAnimal(editAnimal.id, data);
                toast.success(`${data.name} updated successfully.`);
              } else {
                await createAnimal(data);
                toast.success(`${data.name} registered successfully.`);
              }
              setShowForm(false);
              setEditAnimal(null);
              fetchAnimals();
            } catch (err) {
              toast.error(err.message || 'Failed to save animal record');
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(animalToDelete)}
        title="Delete Animal Record"
        message={`Are you sure you want to delete ${animalToDelete?.name} (${animalToDelete?.id})? This action will remove the record.`}
        confirmLabel="Delete Animal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setAnimalToDelete(null)}
      />
    </div>
  );
}

/* ── Animal Form Modal ──────────────────────────────────────────────────── */
function AnimalFormModal({ animal, devices = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: animal?.name || '',
    species: animal?.species || 'Cattle',
    breed: animal?.breed || '',
    age: animal?.age || '',
    sex: animal?.sex || 'Male',
    weight: animal?.weight || '',
    identificationNumber: animal?.identificationNumber || '',
    location: animal?.location || '',
    notes: animal?.notes || '',
    deviceId: animal?.deviceId || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.breed.trim()) errs.breed = 'Breed is required';
    if (!form.age || Number(form.age) <= 0) errs.age = 'Valid age is required';
    if (!form.identificationNumber.trim()) errs.identificationNumber = 'Identification / Tag number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...form,
        age: Number(form.age),
        weight: Number(form.weight) || 0,
      });
    }
  };

  const set = (key, val) => {
    setForm({ ...form, [key]: val });
    setErrors({ ...errors, [key]: undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-navy-900">
            {animal ? `Edit Details: ${animal.name}` : 'Register New Animal'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Bella"
                className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Species *</label>
              <select
                value={form.species}
                onChange={(e) => set('species', e.target.value)}
                className="select-field"
              >
                {speciesList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Breed *</label>
              <input
                value={form.breed}
                onChange={(e) => set('breed', e.target.value)}
                placeholder="e.g. Holstein"
                className={`input-field ${errors.breed ? 'border-red-400' : ''}`}
              />
              {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed}</p>}
            </div>
            <div>
              <label className="label">Age (years) *</label>
              <input
                type="number"
                min="0"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                className={`input-field ${errors.age ? 'border-red-400' : ''}`}
              />
              {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="label">Sex *</label>
              <select
                value={form.sex}
                onChange={(e) => set('sex', e.target.value)}
                className="select-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                min="0"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                placeholder="e.g. 600"
                className="input-field"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Identification Tag Number *</label>
              <input
                value={form.identificationNumber}
                onChange={(e) => set('identificationNumber', e.target.value)}
                placeholder="e.g. TAG-20230101"
                className={`input-field ${errors.identificationNumber ? 'border-red-400' : ''}`}
              />
              {errors.identificationNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.identificationNumber}</p>
              )}
            </div>
            <div>
              <label className="label">Location / Pen</label>
              <input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Barn A - Section 1"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Assign IoT Device</label>
              <select
                value={form.deviceId}
                onChange={(e) => set('deviceId', e.target.value)}
                className="select-field"
              >
                <option value="">None (Unassigned)</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} ({d.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Veterinary / Observation Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Add behavioral or medical remarks…"
              className="input-field resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm">
              {animal ? 'Save Changes' : 'Register Animal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
