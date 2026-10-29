import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Wifi, WifiOff, ThermometerSun, Heart, Activity, Clock,
  Calendar, Info, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import SensorChart from '../components/SensorChart';
import LoadingState from '../components/LoadingState';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { getSensorReadings, getLatestReading } from '../services/sensorService';
import { getAnimals } from '../services/animalService';
import { getDevices } from '../services/deviceService';

export default function LiveMonitoring() {
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [timeFilter, setTimeFilter] = useState('24h'); // 6h, 12h, 24h, all
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load animal and device lists from service layer
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [anmRes, devRes] = await Promise.all([getAnimals(), getDevices()]);
        const anmList = anmRes.data || [];
        setAnimals(anmList);
        setDevices(devRes.data || []);
        if (anmList.length > 0 && !selectedAnimal) {
          const monitored = anmList.find((a) => a.deviceId);
          setSelectedAnimal(monitored ? monitored.id : anmList[0].id);
        }
      } catch (err) {
        console.warn('Failed to load animal/device lists:', err.message);
      }
    }
    loadMetadata();
  }, []);

  const monitoredAnimals = useMemo(() => {
    return animals.filter((a) => a.deviceId) || animals;
  }, [animals]);

  const fetchData = useCallback(async (isManual = false) => {
    if (!selectedAnimal) return;
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const { data: r } = await getSensorReadings(selectedAnimal);
      setReadings(r);
      const { data: l } = await getLatestReading(selectedAnimal);
      setLatest(l);
      setLastRefresh(new Date());
      if (isManual) {
        toast.success('Sensor telemetry refreshed.');
      }
    } catch (err) {
      toast.error('Failed to load sensor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAnimal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Simulate live updates every 30s in demo mode
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const animal = animals.find((a) => String(a.id) === String(selectedAnimal));
  const device = devices.find((d) => String(d.id) === String(animal?.deviceId) || String(d.assignedAnimalId) === String(animal?.id));

  // Filter readings by selected timeframe
  const filteredReadings = useMemo(() => {
    if (timeFilter === 'all') return readings;
    const hours = timeFilter === '6h' ? 6 : timeFilter === '12h' ? 12 : 24;
    return readings.slice(-hours);
  }, [readings, timeFilter]);

  const chartData = useMemo(() => {
    return filteredReadings.map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: r.temperature,
      activity: r.activityLevel,
      heartRate: r.heartRate,
    }));
  }, [filteredReadings]);

  // Columns for the readings DataTable with pagination
  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-gray-600 font-mono">
          {new Date(v).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'temperature',
      label: 'Body Temp (°C)',
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
      label: 'Activity Level (%)',
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
      label: 'Heart Rate (bpm)',
      sortable: true,
      render: (v) => (
        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
          <Heart className="w-3.5 h-3.5 text-purple-600" />
          {v} bpm
        </span>
      ),
    },
    {
      key: 'humidity',
      label: 'Ambient Humidity',
      sortable: true,
      render: (v) => `${v}%`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Filter and Control Bar */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Target Monitored Animal</label>
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              className="select-field text-sm font-semibold min-w-[220px]"
            >
              {monitoredAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.species} ({a.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Time Window</label>
            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
              <button
                onClick={() => setTimeFilter('6h')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeFilter === '6h'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                6 Hours
              </button>
              <button
                onClick={() => setTimeFilter('12h')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeFilter === '12h'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                12 Hours
              </button>
              <button
                onClick={() => setTimeFilter('24h')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeFilter === '24h'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeFilter === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All History
              </button>
            </div>
          </div>

          {device && (
            <div className="self-end mb-1">
              <StatusBadge status={device.status} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last synced: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>

      <LoadingState loading={loading && !latest}>
        {latest && (
          <>
            {/* Live Telemetry Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Body Temperature"
                value={`${latest.temperature}°C`}
                subtitle={latest.temperature > 39.5 ? 'Elevated above threshold' : 'Normal range'}
                icon={<ThermometerSun className="w-6 h-6" />}
                color={latest.temperature > 39.5 ? 'red' : 'teal'}
              />
              <StatCard
                title="Activity Level"
                value={`${latest.activityLevel}%`}
                subtitle="Accelerometry intensity"
                icon={<Activity className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Heart Rate"
                value={`${latest.heartRate} bpm`}
                subtitle={device?.sensorType?.includes('Heart Rate') ? 'Supported by sensor' : 'Calculated proxy'}
                icon={<Heart className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Device Connectivity"
                value={device?.status === 'online' ? 'Online' : 'Offline'}
                subtitle={`Battery: ${device?.batteryLevel || 0}% • ${device?.id || 'DEV'}`}
                icon={device?.status === 'online' ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                color={device?.status === 'online' ? 'green' : 'gray'}
              />
            </div>

            {/* Hardware Information Panel */}
            <div className="card p-5">
              <h3 className="section-title mb-3">Linked IoT Hardware Specification</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Device Serial</p>
                  <p className="font-semibold text-gray-800">{device?.id || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Form Factor</p>
                  <p className="font-semibold text-gray-800">{device?.type || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Sensor Capability</p>
                  <p className="font-semibold text-gray-800">{device?.sensorType || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Last Ping</p>
                  <p className="font-semibold text-gray-800">
                    {device?.lastCommunication ? new Date(device.lastCommunication).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Historical Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SensorChart
                title={`Body Temperature Profile (${timeFilter.toUpperCase()})`}
                data={chartData}
                xKey="time"
                lines={[{ key: 'temperature', color: '#ef4444', label: 'Temperature (°C)' }]}
              />
              <SensorChart
                title={`Locomotion & Activity Level (${timeFilter.toUpperCase()})`}
                data={chartData}
                xKey="time"
                lines={[{ key: 'activity', color: '#06b6d4', label: 'Activity (%)' }]}
              />
            </div>

            <SensorChart
              title={`Heart Rate Telemetry (${timeFilter.toUpperCase()})`}
              data={chartData}
              xKey="time"
              lines={[{ key: 'heartRate', color: '#8b5cf6', label: 'Heart Rate (bpm)' }]}
            />

            {/* Ingested Telemetry Table with Pagination */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="section-title">Telemetry Stream Log</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Chronological packets recorded for {animal?.name} ({animal?.id})
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  Total {filteredReadings.length} records in current window
                </span>
              </div>

              <DataTable
                columns={columns}
                data={[...filteredReadings].reverse()}
                pageSize={5}
                pageSizeOptions={[5, 10, 20]}
                searchable
                searchPlaceholder="Search readings by temp or timestamp…"
                searchKeys={['temperature', 'timestamp']}
              />
            </div>
          </>
        )}
      </LoadingState>
    </div>
  );
}
