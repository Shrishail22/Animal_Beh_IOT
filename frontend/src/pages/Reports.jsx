import { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart, Download, Printer, Calendar, TrendingUp,
  Activity, Thermometer, Heart, AlertTriangle, Filter, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import DataTable from '../components/DataTable';
import {
  getReportSummary, getReportTrends, getReportRecords, exportCSV
} from '../services/reportService';
import { getAnimals } from '../services/animalService';

export default function Reports() {
  const [period, setPeriod] = useState('weekly'); // daily, weekly, monthly, custom
  const [animalFilter, setAnimalFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [animals, setAnimals] = useState([]);
  const [animalRows, setAnimalRows] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, trendRes, anmRes, recRes] = await Promise.all([
          getReportSummary(period === 'custom' ? 'weekly' : period),
          getReportTrends(period === 'custom' ? 'weekly' : period),
          getAnimals(),
          getReportRecords({
            animalId: animalFilter,
            period,
            from: startDate,
            to: endDate,
          }),
        ]);
        setSummaryData(sumRes.data);
        setTrendData(trendRes.data || []);
        setAnimals(anmRes.data || []);
        setAnimalRows(recRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to generate report summaries.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [period, animalFilter, startDate, endDate]);

  // Behavior breakdown transformed for chart
  const behaviorChartData = useMemo(() => {
    if (!summaryData?.behaviorBreakdown) return [];
    return Object.entries(summaryData.behaviorBreakdown).map(([name, pct]) => ({
      name,
      percentage: pct,
    }));
  }, [summaryData]);

  const handleExportCSV = async () => {
    try {
      if (!animalRows || animalRows.length === 0) {
        toast.error('No report records available to export.');
        return;
      }
      const exportData = animalRows.map((r) => ({
        'Animal ID': r.animalId,
        'Animal Name': r.animalName,
        'Species': r.species,
        'Date Time': new Date(r.timestamp).toISOString(),
        'Temperature (°C)': r.temperature,
        'Activity (%)': r.activityLevel,
        'Heart Rate (bpm)': r.heartRate,
      }));
      await exportCSV(exportData, `animal_monitoring_${period}_report.csv`);
      toast.success(`Exported ${exportData.length} records to CSV.`);
    } catch (err) {
      console.error('Failed to export CSV report:', err);
      toast.error('Failed to export CSV report: ' + (err.message || 'Error'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // DataTable column definitions for ingested records
  const columns = [
    {
      key: 'animalName',
      label: 'Animal',
      sortable: true,
      render: (v, row) => (
        <span className="font-semibold text-gray-800">
          {v} <span className="text-xs text-gray-400">({row.animalId})</span>
        </span>
      ),
    },
    { key: 'species', label: 'Species', sortable: true },
    {
      key: 'timestamp',
      label: 'Date & Time',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(v).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'temperature',
      label: 'Temperature (°C)',
      sortable: true,
      render: (v) => `${v}°C`,
    },
    {
      key: 'activityLevel',
      label: 'Activity Level (%)',
      sortable: true,
      render: (v) => `${v}%`,
    },
    {
      key: 'heartRate',
      label: 'Heart Rate (bpm)',
      sortable: true,
      render: (v) => `${v} bpm`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Top action and filter bar */}
      <div className="card p-4 space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Timeframe Preset</label>
              <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
                <button
                  onClick={() => setPeriod('daily')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    period === 'daily'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    period === 'weekly'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    period === 'monthly'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Target Cohort</label>
              <select
                value={animalFilter}
                onChange={(e) => setAnimalFilter(e.target.value)}
                className="select-field text-xs py-1.5 w-auto"
              >
                <option value="all">All Registered Animals</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.species} - {a.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range Pickers */}
            <div className="flex items-center gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field text-xs py-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field text-xs py-1"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="btn-ghost text-xs text-gray-500 hover:text-gray-800 self-end mb-0.5"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-gray-600" />
              Download CSV
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-white" />
              Print Report Layout
            </button>
          </div>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AnimalWatch — IoT Livestock Behavioural & Sensor Health Report
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Generated by <strong>Shirshail</strong> (Farm Administrator) on {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p><strong>Period:</strong> {period.toUpperCase()}</p>
            <p><strong>Scope:</strong> {animalFilter === 'all' ? 'All Registered Livestock' : `Animal ID ${animalFilter}`}</p>
          </div>
        </div>
      </div>

      <LoadingState loading={loading} error={error}>
        {summaryData && (
          <>
            {/* KPI Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Sensor Ingestions"
                value={summaryData.totalReadings}
                subtitle={`${period} telemetry cycles`}
                icon={<Activity className="w-6 h-6" />}
                color="teal"
              />
              <StatCard
                title="Average Body Temp"
                value={`${summaryData.avgTemperature}°C`}
                subtitle="Baseline normal range: 37.5-39.5"
                icon={<Thermometer className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Mean Activity Level"
                value={`${summaryData.avgActivity}%`}
                subtitle="Average locomotor movement"
                icon={<TrendingUp className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Alerts Incident Count"
                value={summaryData.alertsTriggered}
                subtitle={`${summaryData.alertsAcknowledged} resolved`}
                icon={<AlertTriangle className="w-6 h-6" />}
                color="amber"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Line Chart */}
              <div className="card p-5">
                <h3 className="section-title mb-1">
                  Sensor Multi-Variate Trends ({period.toUpperCase()})
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Comparative metric trajectory across logging intervals
                </p>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        name="Avg Temp (°C)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="activity"
                        name="Avg Activity (%)"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        name="Avg Heart Rate"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Behavior Percentage Bar Chart */}
              <div className="card p-5">
                <h3 className="section-title mb-1">Behavioral Allocation Ratio</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Percentage breakdown of animal state categories
                </p>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={behaviorChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip
                        formatter={(val) => [`${val}%`, 'Allocation']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Bar dataKey="percentage" fill="#0d9488" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Animal-Specific Historical Telemetry Log Table with Pagination */}
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="section-title">Ingested Sensor Telemetry Records</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Data samples available for download and veterinary export
                  </p>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={animalRows}
                searchable
                searchPlaceholder="Search records by animal name or species…"
                searchKeys={['animalName', 'species', 'animalId']}
                pageSize={10}
                pageSizeOptions={[5, 10, 20, 50]}
                emptyMessage="No sensor records match your date range and cohort filter."
              />
            </div>
          </>
        )}
      </LoadingState>
    </div>
  );
}
