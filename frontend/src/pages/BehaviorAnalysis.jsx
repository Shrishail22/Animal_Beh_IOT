import { useState, useEffect, useMemo } from 'react';
import {
  Brain, AlertTriangle, Filter, Calendar, Activity, Thermometer, Heart,
  Sparkles, CheckCircle2, ChevronRight, X, Info, HelpCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import DataTable from '../components/DataTable';
import { getPredictions } from '../services/predictionService';
import { getAnimals } from '../services/animalService';
import { behaviorCategories } from '../mock/mockData';

const BEHAVIOR_COLORS = {
  Resting: '#06b6d4',
  Active: '#10b981',
  Feeding: '#f59e0b',
  Walking: '#8b5cf6',
  Abnormal: '#ef4444',
};

export default function BehaviorAnalysis() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [selectedBehavior, setSelectedBehavior] = useState('all');
  const [dateFilter, setDateFilter] = useState('7d'); // 24h, 7d, all
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const { data } = await getAnimals();
        setAnimals(data || []);
        if (data && data.length > 0 && !selectedAnimalId) {
          setSelectedAnimalId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to load animals:', err.message);
      }
    }
    fetchAnimals();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!selectedAnimalId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getPredictions(selectedAnimalId);
        setPredictions(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load behavioral predictions.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedAnimalId]);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  // Filter predictions by behavior and date window
  const filteredPredictions = useMemo(() => {
    const now = new Date().getTime();
    return predictions.filter((p) => {
      if (selectedBehavior !== 'all' && p.predictedBehavior !== selectedBehavior) return false;
      if (dateFilter !== 'all') {
        const pTime = new Date(p.timestamp).getTime();
        const diffHours = (now - pTime) / (1000 * 60 * 60);
        if (dateFilter === '24h' && diffHours > 24) return false;
        if (dateFilter === '7d' && diffHours > 168) return false;
      }
      return true;
    });
  }, [predictions, selectedBehavior, dateFilter]);

  // Distribution chart data
  const distributionData = useMemo(() => {
    const counts = {};
    behaviorCategories.forEach((cat) => { counts[cat] = 0; });
    filteredPredictions.forEach((p) => {
      if (counts[p.predictedBehavior] !== undefined) {
        counts[p.predictedBehavior] += 1;
      }
    });
    const total = filteredPredictions.length || 1;
    return behaviorCategories.map((name) => ({
      name,
      count: counts[name],
      percentage: Number(((counts[name] / total) * 100).toFixed(1)),
      color: BEHAVIOR_COLORS[name] || '#94a3b8',
    }));
  }, [filteredPredictions]);

  // Key metrics
  const abnormalCount = filteredPredictions.filter((p) => p.predictedBehavior === 'Abnormal').length;
  const avgConfidence = filteredPredictions.length
    ? Math.round((filteredPredictions.reduce((acc, p) => acc + (p.confidence || 0), 0) / filteredPredictions.length) * 100)
    : 0;
  const dominantBehavior = distributionData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), distributionData[0]);

  // Columns for paginated historical predictions table
  const columns = [
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
      key: 'predictedBehavior',
      label: 'Predicted Behavior',
      sortable: true,
      render: (v) => (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${BEHAVIOR_COLORS[v]}20`,
            color: BEHAVIOR_COLORS[v] || '#475569',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: BEHAVIOR_COLORS[v] }}
          />
          {v}
        </span>
      ),
    },
    {
      key: 'confidence',
      label: 'Confidence',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                v > 0.8 ? 'bg-teal-500' : v > 0.6 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.round(v * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700">
            {Math.round(v * 100)}%
          </span>
        </div>
      ),
    },
    {
      key: 'sensorSnapshot',
      label: 'Concurrent Sensor Telemetry',
      render: (s) => (
        <span className="inline-flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-red-500" />
            {s?.temperature}°C
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            {s?.activityLevel}%
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-purple-600" />
            {s?.heartRate} bpm
          </span>
        </span>
      ),
    },
    {
      key: 'isAbnormal',
      label: 'Anomaly Flag',
      render: (_, row) =>
        row.predictedBehavior === 'Abnormal' ? (
          <span className="badge-red flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" /> Abnormal Pattern
          </span>
        ) : (
          <span className="badge-green flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Normal Baseline
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPrediction(row);
          }}
          className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold px-2 py-1 rounded hover:bg-teal-50"
        >
          Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Target Animal</label>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="select-field text-sm font-medium text-gray-800 min-w-[200px]"
            >
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.species} - {a.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Behavior Category</label>
            <select
              value={selectedBehavior}
              onChange={(e) => setSelectedBehavior(e.target.value)}
              className="select-field text-sm min-w-[150px]"
            >
              <option value="all">All Behaviors</option>
              {behaviorCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Time Window</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="select-field text-sm min-w-[130px]"
            >
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="all">All Available</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Classification Engine: <strong>Ensemble Random Forest v1.0</strong></span>
        </div>
      </div>

      <LoadingState loading={loading} error={error}>
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Dominant Behavior"
            value={dominantBehavior?.name || '—'}
            subtitle={`${dominantBehavior?.percentage || 0}% of recorded observations`}
            icon={<Brain className="w-6 h-6" />}
            color="teal"
          />
          <StatCard
            title="Average Confidence"
            value={`${avgConfidence}%`}
            subtitle="Model certainty across predictions"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Abnormal Patterns"
            value={abnormalCount}
            subtitle={abnormalCount > 0 ? 'Requires observation & review' : 'No abnormal flags'}
            icon={<AlertTriangle className="w-6 h-6" />}
            color={abnormalCount > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Filtered Observations"
            value={filteredPredictions.length}
            subtitle={`Animal ID: ${selectedAnimal?.id}`}
            icon={<Activity className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Pie */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="section-title">Behavioral Distribution</h3>
                <p className="text-xs text-gray-400 mt-0.5">Aggregated percentage breakdown</p>
              </div>
              <span className="badge-blue text-xs font-semibold px-2.5 py-1 rounded-full">
                {selectedAnimal?.name}
              </span>
            </div>
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="count"
                    stroke="none"
                  >
                    {distributionData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} occurrences (${item.payload.percentage}%)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior Frequency Bar Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="section-title">Observation Counts by State</h3>
                <p className="text-xs text-gray-400 mt-0.5">Frequency per classification category</p>
              </div>
            </div>
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val) => [`${val} detections`, 'Count']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distributionData.map((entry) => (
                      <Cell key={`bar-${entry.name}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Prediction History Table with Pagination */}
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="section-title">Historical ML Predictions</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Correlation between IoT sensor snapshots and model inferences
              </p>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredPredictions}
            searchable
            searchPlaceholder="Search predictions by behavior or timestamp…"
            searchKeys={['predictedBehavior', 'timestamp']}
            pageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            onRowClick={(row) => setSelectedPrediction(row)}
            emptyMessage="No predictions found matching your filter."
          />
        </div>
      </LoadingState>

      {/* Prediction Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPrediction(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-navy-900">Prediction Details</h3>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Record ID:</span>
                <span className="font-mono text-gray-800 text-xs">{selectedPrediction.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Animal:</span>
                <span className="font-semibold text-gray-800">
                  {selectedAnimal?.name} ({selectedPrediction.animalId})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-800">
                  {new Date(selectedPrediction.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Predicted Behavior:</span>
                <span
                  className="font-bold px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: `${BEHAVIOR_COLORS[selectedPrediction.predictedBehavior]}20`,
                    color: BEHAVIOR_COLORS[selectedPrediction.predictedBehavior],
                  }}
                >
                  {selectedPrediction.predictedBehavior}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Model Confidence:</span>
                <span className="font-semibold text-teal-700">
                  {Math.round(selectedPrediction.confidence * 100)}%
                </span>
              </div>

              {/* Sensor telemetry snapshot */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Concurrent Sensor Telemetry
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400">Temperature</p>
                    <p className="font-bold text-red-600">
                      {selectedPrediction.sensorSnapshot?.temperature}°C
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400">Activity Level</p>
                    <p className="font-bold text-teal-600">
                      {selectedPrediction.sensorSnapshot?.activityLevel}%
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400">Heart Rate</p>
                    <p className="font-bold text-purple-600">
                      {selectedPrediction.sensorSnapshot?.heartRate} bpm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPrediction(null)}
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
