import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Cpu, PawPrint, Activity } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SensorChart from '../components/SensorChart';
import LoadingState from '../components/LoadingState';
import { getAnimalById } from '../services/animalService';
import { getSensorReadings } from '../services/sensorService';
import { getPredictions } from '../services/predictionService';

export default function AnimalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [readings, setReadings] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: a } = await getAnimalById(id);
        setAnimal(a);
        const { data: r } = await getSensorReadings(id);
        setReadings(r);
        const { data: p } = await getPredictions(id);
        setPredictions(p);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const chartData = readings.slice(-24).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: r.temperature,
    activity: r.activityLevel,
    heartRate: r.heartRate,
  }));

  const recentPreds = predictions.slice(-10);

  return (
    <LoadingState loading={loading} error={error} empty={!animal} emptyMessage="Animal not found.">
      {animal && (
        <div className="space-y-6 animate-fade-in">
          {/* Back */}
          <button onClick={() => navigate('/animals')} className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Animals
          </button>

          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-10 h-10 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h2 className="text-2xl font-bold text-navy-900">{animal.name}</h2>
                  <StatusBadge status={animal.status} size="lg" />
                </div>
                <p className="text-sm text-gray-500 mb-4">{animal.species} · {animal.breed} · {animal.sex} · {animal.age} years old</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoItem icon={<Cpu className="w-4 h-4" />} label="Device" value={animal.deviceId || 'Not assigned'} />
                  <InfoItem icon={<MapPin className="w-4 h-4" />} label="Location" value={animal.location} />
                  <InfoItem icon={<Calendar className="w-4 h-4" />} label="Last Checkup" value={animal.lastCheckup ? new Date(animal.lastCheckup).toLocaleDateString() : '—'} />
                  <InfoItem icon={<Activity className="w-4 h-4" />} label="Weight" value={`${animal.weight} kg`} />
                </div>
                {animal.notes && (
                  <p className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded-lg">{animal.notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sensor History */}
          {chartData.length > 0 && (
            <SensorChart
              title="Sensor History (Last 24 Readings)"
              data={chartData}
              xKey="time"
              lines={[
                { key: 'temperature', color: '#ef4444', label: 'Temp (°C)' },
                { key: 'activity',    color: '#06b6d4', label: 'Activity (%)' },
                { key: 'heartRate',   color: '#8b5cf6', label: 'Heart Rate' },
              ]}
            />
          )}

          {/* Behavior History */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Recent Behavioral Predictions</h3>
            <p className="text-xs text-gray-400 mb-3">Example predictions — not validated ML output</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Timestamp</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Predicted Behavior</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Confidence</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Temp</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentPreds.map((p) => (
                    <tr key={p.id} className="hover:bg-teal-50/30">
                      <td className="py-2 px-3 text-xs text-gray-500">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={p.predictedBehavior === 'Abnormal' ? 'critical' : 'normal'} />
                        <span className="ml-2 text-sm">{p.predictedBehavior}</span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal-500"
                              style={{ width: `${(p.confidence * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{(p.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-xs">{p.sensorSnapshot.temperature}°C</td>
                      <td className="py-2 px-3 text-xs">{p.sensorSnapshot.activityLevel}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </LoadingState>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}
