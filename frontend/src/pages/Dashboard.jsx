import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint, Activity, ShieldCheck, AlertTriangle, Cpu, Wifi, WifiOff,
  TrendingUp, BarChart3, ThermometerSun, Calendar, Filter, Clock,
  ArrowRight, Heart
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import SensorChart from '../components/SensorChart';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import DataTable from '../components/DataTable';
import { getDashboardSummary } from '../services/dashboardService';
import { getAnimals } from '../services/animalService';
import { speciesList } from '../mock/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedAnimalId, setSelectedAnimalId] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h'); // 24h, 7d, 30d

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [dashRes, animalRes] = await Promise.all([
          getDashboardSummary({
            species: selectedSpecies,
            animalId: selectedAnimalId,
            timeframe: selectedTimeframe,
          }),
          getAnimals(),
        ]);
        setDashboardData(dashRes.data);
        setAnimals(animalRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics from server.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [selectedSpecies, selectedAnimalId, selectedTimeframe]);

  // Filter animals based on species and animal selector
  const eligibleAnimals = useMemo(() => {
    return animals.filter((a) => {
      if (selectedSpecies !== 'all' && a.species !== selectedSpecies) return false;
      if (selectedAnimalId !== 'all' && a.id !== selectedAnimalId) return false;
      return true;
    });
  }, [animals, selectedSpecies, selectedAnimalId]);

  // Derived metrics from dashboardData
  const totalRegistered = eligibleAnimals.length || dashboardData?.totalAnimals || 0;
  const currentlyMonitored = eligibleAnimals.filter((a) => a.deviceId).length || dashboardData?.monitoredAnimals || 0;
  const abnormalAlertsCount = dashboardData?.abnormalAlerts || 0;
  const normalBehaviorCount = Math.max(0, currentlyMonitored - abnormalAlertsCount) || dashboardData?.normalBehavior || 0;

  const behaviorDistribution = dashboardData?.behaviorDistribution || [];
  const sensorTrends = dashboardData?.sensorTrends || [];
  const recentAlerts = dashboardData?.recentAlerts || [];
  const recentReadings = dashboardData?.recentReadings || [];

  // Filter sensor readings table by selected animal if chosen
  const filteredReadings = useMemo(() => {
    if (selectedAnimalId === 'all') return recentReadings;
    return recentReadings.filter((r) => r.animalId === selectedAnimalId);
  }, [recentReadings, selectedAnimalId]);

  // Columns for recent readings table with pagination
  const readingColumns = [
    {
      key: 'animalName',
      label: 'Animal',
      sortable: true,
      render: (v, row) => (
        <span
          onClick={() => navigate(`/animals/${row.animalId}`)}
          className="font-medium text-teal-700 hover:text-teal-900 hover:underline cursor-pointer flex items-center gap-1"
        >
          {v} <span className="text-xs text-gray-400">({row.animalId})</span>
        </span>
      ),
    },
    {
      key: 'temperature',
      label: 'Temperature',
      sortable: true,
      render: (v) => (
        <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
          <ThermometerSun className="w-3.5 h-3.5 text-red-500" />
          {v}°C
        </span>
      ),
    },
    {
      key: 'activityLevel',
      label: 'Activity',
      sortable: true,
      render: (v) => (
        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
          <Activity className="w-3.5 h-3.5 text-teal-600" />
          {v}%
        </span>
      ),
    },
    {
      key: 'heartRate',
      label: 'Heart Rate',
      sortable: true,
      render: (v) => (
        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
          <Heart className="w-3.5 h-3.5 text-purple-600" />
          {v} bpm
        </span>
      ),
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-gray-500">
          {new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Global Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Filter by Species</label>
            <select
              value={selectedSpecies}
              onChange={(e) => {
                setSelectedSpecies(e.target.value);
                setSelectedAnimalId('all');
              }}
              className="select-field text-sm w-auto min-w-[140px]"
            >
              <option value="all">All Species</option>
              {speciesList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Filter by Animal</label>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="select-field text-sm w-auto min-w-[180px]"
            >
              <option value="all">All Animals ({eligibleAnimals.length})</option>
              {eligibleAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.species} - {a.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Date Timeframe</label>
            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
              <button
                onClick={() => setSelectedTimeframe('24h')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedTimeframe === '24h'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 24h
              </button>
              <button
                onClick={() => setSelectedTimeframe('7d')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedTimeframe === '7d'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setSelectedTimeframe('30d')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedTimeframe === '30d'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </div>

        {(selectedSpecies !== 'all' || selectedAnimalId !== 'all') && (
          <button
            onClick={() => {
              setSelectedSpecies('all');
              setSelectedAnimalId('all');
            }}
            className="btn-ghost text-xs text-gray-500 hover:text-gray-800 self-end mb-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      <LoadingState loading={loading} error={error}>
        {dashboardData && (
          <>
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Registered Animals"
                value={totalRegistered}
                subtitle={selectedSpecies === 'all' ? 'All cataloged livestock' : `${selectedSpecies} cohort`}
                icon={<PawPrint className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Currently Monitored"
                value={currentlyMonitored}
                subtitle="Equipped with active IoT collar/tag"
                icon={<Activity className="w-6 h-6" />}
                color="teal"
              />
              <StatCard
                title="Normal Behavior Count"
                value={normalBehaviorCount}
                subtitle="Within historical baseline"
                icon={<ShieldCheck className="w-6 h-6" />}
                color="green"
              />
              <StatCard
                title="Abnormal Behavior Alerts"
                value={abnormalAlertsCount}
                subtitle="Critical unacknowledged alerts"
                icon={<AlertTriangle className="w-6 h-6" />}
                color={abnormalAlertsCount > 0 ? 'red' : 'green'}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Behavior Distribution Chart */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="section-title">Animal Behavioral Distribution</h3>
                  <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                    ML Inferences
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Provisional classification categories for monitored livestock
                </p>
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={behaviorDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {behaviorDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                        formatter={(v) => [`${v}%`, 'Proportion']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sensor Trends Over Time */}
              <SensorChart
                title={`Sensor Trends (${selectedTimeframe === '24h' ? '24 Hours' : selectedTimeframe})`}
                data={sensorTrends}
                xKey="time"
                lines={[
                  { key: 'avgTemperature', color: '#ef4444', label: 'Temp (°C)' },
                  { key: 'avgActivity',    color: '#06b6d4', label: 'Activity (%)' },
                  { key: 'avgHeartRate',    color: '#8b5cf6', label: 'Heart Rate' },
                ]}
              />
            </div>

            {/* Device Statistics and Recent Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Device Online/Offline Stats */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title">Device Fleet Status</h3>
                  <button
                    onClick={() => navigate('/devices')}
                    className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-900">
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      Online & Active
                    </div>
                    <span className="text-xl font-bold text-emerald-700">
                      {dashboardData.devicesOnline}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                      <WifiOff className="w-4 h-4 text-gray-500" />
                      Offline
                    </div>
                    <span className="text-xl font-bold text-gray-600">
                      {dashboardData.devicesOffline}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Warning / Low Power
                    </div>
                    <span className="text-xl font-bold text-amber-700">
                      {dashboardData.devicesWarning}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                    <span>Total Registered Hardware</span>
                    <span className="font-bold text-navy-900 text-sm">
                      {dashboardData.totalDevices} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Alerts List */}
              <div className="card p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="section-title">Recent System Alerts</h3>
                    <p className="text-xs text-gray-400 mt-0.5">High priority events requiring action</p>
                  </div>
                  <button
                    onClick={() => navigate('/alerts')}
                    className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                  >
                    View All Alerts <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {recentAlerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => navigate('/alerts')}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 cursor-pointer transition-colors border border-gray-100"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                            alert.severity === 'critical'
                              ? 'bg-red-500 ring-2 ring-red-200'
                              : alert.severity === 'warning'
                              ? 'bg-amber-500 ring-2 ring-amber-200'
                              : 'bg-blue-500 ring-2 ring-blue-200'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                            <StatusBadge status={alert.severity} />
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {alert.description}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Animal: <strong>{alert.animalName}</strong> ({alert.animalId}) •{' '}
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {alert.acknowledged ? (
                          <span className="badge-green text-[10px]">Acknowledged</span>
                        ) : (
                          <span className="badge-yellow text-[10px]">Action Required</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Sensor Telemetry Table with Pagination */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="section-title">Recent Ingested Sensor Readings</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time packet data from deployed wearable collars
                  </p>
                </div>
                <button
                  onClick={() => navigate('/monitoring')}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                >
                  Open Live Monitor <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <DataTable
                columns={readingColumns}
                data={filteredReadings}
                pageSize={5}
                pageSizeOptions={[5, 10, 20]}
                searchable
                searchPlaceholder="Search readings by animal name or ID…"
                searchKeys={['animalName', 'animalId']}
                emptyMessage="No sensor readings available for current filter."
              />
            </div>
          </>
        )}
      </LoadingState>
    </div>
  );
}
