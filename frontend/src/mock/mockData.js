// =============================================================================
// Mock Data for IoT Animal Behavioural Monitoring System
// =============================================================================
// WARNING: This is DEMO / SAMPLE data only.
// It does NOT come from real sensors, real animals, or a real ML model.
// All readings, predictions, and alerts are fabricated for UI demonstration.
// =============================================================================

// ── Helper ──────────────────────────────────────────────────────────────────
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const now = new Date();
const daysAgo = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const hoursAgo = (n) => {
  const d = new Date(now);
  d.setHours(d.getHours() - n);
  return d.toISOString();
};
const minutesAgo = (n) => {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
};

// ── Species & Breeds ────────────────────────────────────────────────────────
export const speciesList = ['Cattle', 'Sheep', 'Goat', 'Horse', 'Pig', 'Chicken'];
const breedMap = {
  Cattle: ['Holstein', 'Angus', 'Hereford', 'Jersey', 'Simmental'],
  Sheep: ['Merino', 'Suffolk', 'Dorper', 'Romney', 'Texel'],
  Goat: ['Boer', 'Nubian', 'Alpine', 'Saanen', 'LaMancha'],
  Horse: ['Thoroughbred', 'Quarter Horse', 'Arabian', 'Appaloosa', 'Mustang'],
  Pig: ['Yorkshire', 'Duroc', 'Hampshire', 'Berkshire', 'Landrace'],
  Chicken: ['Leghorn', 'Rhode Island Red', 'Plymouth Rock', 'Sussex', 'Wyandotte'],
};

// ── Behavioral Categories ───────────────────────────────────────────────────
// These are EXAMPLE categories. Actual categories will be supplied by the ML
// model via the backend.
export const behaviorCategories = [
  'Resting',
  'Active',
  'Feeding',
  'Walking',
  'Abnormal',
];

// ── Animals ─────────────────────────────────────────────────────────────────
export const mockAnimals = [
  {
    id: 'ANM-001',
    name: 'Bella',
    species: 'Cattle',
    breed: 'Holstein',
    age: 4,
    sex: 'Female',
    weight: 650,
    identificationNumber: 'TAG-20230101',
    status: 'monitored',
    deviceId: 'DEV-001',
    location: 'Barn A - Section 1',
    registeredAt: daysAgo(365),
    lastCheckup: daysAgo(14),
    notes: 'Healthy dairy cow, regular milking schedule.',
  },
  {
    id: 'ANM-002',
    name: 'Thunder',
    species: 'Horse',
    breed: 'Thoroughbred',
    age: 6,
    sex: 'Male',
    weight: 500,
    identificationNumber: 'TAG-20230215',
    status: 'monitored',
    deviceId: 'DEV-002',
    location: 'Stable B',
    registeredAt: daysAgo(300),
    lastCheckup: daysAgo(7),
    notes: 'Show horse, needs regular exercise monitoring.',
  },
  {
    id: 'ANM-003',
    name: 'Woolly',
    species: 'Sheep',
    breed: 'Merino',
    age: 3,
    sex: 'Female',
    weight: 70,
    identificationNumber: 'TAG-20230310',
    status: 'monitored',
    deviceId: 'DEV-003',
    location: 'Pasture C',
    registeredAt: daysAgo(250),
    lastCheckup: daysAgo(30),
    notes: 'Part of wool production flock.',
  },
  {
    id: 'ANM-004',
    name: 'Daisy',
    species: 'Cattle',
    breed: 'Jersey',
    age: 5,
    sex: 'Female',
    weight: 450,
    identificationNumber: 'TAG-20230422',
    status: 'monitored',
    deviceId: 'DEV-004',
    location: 'Barn A - Section 2',
    registeredAt: daysAgo(200),
    lastCheckup: daysAgo(21),
    notes: 'High milk producer.',
  },
  {
    id: 'ANM-005',
    name: 'Rocky',
    species: 'Goat',
    breed: 'Boer',
    age: 2,
    sex: 'Male',
    weight: 90,
    identificationNumber: 'TAG-20230518',
    status: 'monitored',
    deviceId: 'DEV-005',
    location: 'Pen D',
    registeredAt: daysAgo(180),
    lastCheckup: daysAgo(10),
    notes: 'Young breeding buck.',
  },
  {
    id: 'ANM-006',
    name: 'Patches',
    species: 'Cattle',
    breed: 'Hereford',
    age: 7,
    sex: 'Female',
    weight: 600,
    identificationNumber: 'TAG-20230605',
    status: 'normal',
    deviceId: null,
    location: 'Pasture E',
    registeredAt: daysAgo(160),
    lastCheckup: daysAgo(45),
    notes: 'No device currently assigned.',
  },
  {
    id: 'ANM-007',
    name: 'Babe',
    species: 'Pig',
    breed: 'Yorkshire',
    age: 1,
    sex: 'Female',
    weight: 110,
    identificationNumber: 'TAG-20230720',
    status: 'monitored',
    deviceId: 'DEV-006',
    location: 'Pen F',
    registeredAt: daysAgo(120),
    lastCheckup: daysAgo(5),
    notes: 'Young sow under behavioral observation.',
  },
  {
    id: 'ANM-008',
    name: 'Shadow',
    species: 'Horse',
    breed: 'Arabian',
    age: 8,
    sex: 'Male',
    weight: 470,
    identificationNumber: 'TAG-20230801',
    status: 'alert',
    deviceId: 'DEV-007',
    location: 'Stable B',
    registeredAt: daysAgo(100),
    lastCheckup: daysAgo(2),
    notes: 'Showing signs of reduced activity — under observation.',
  },
  {
    id: 'ANM-009',
    name: 'Clucky',
    species: 'Chicken',
    breed: 'Rhode Island Red',
    age: 1,
    sex: 'Female',
    weight: 3,
    identificationNumber: 'TAG-20230915',
    status: 'normal',
    deviceId: null,
    location: 'Coop G',
    registeredAt: daysAgo(60),
    lastCheckup: daysAgo(15),
    notes: 'Layer hen, no device assigned yet.',
  },
  {
    id: 'ANM-010',
    name: 'Buttercup',
    species: 'Goat',
    breed: 'Nubian',
    age: 4,
    sex: 'Female',
    weight: 65,
    identificationNumber: 'TAG-20231001',
    status: 'monitored',
    deviceId: 'DEV-008',
    location: 'Pen D',
    registeredAt: daysAgo(40),
    lastCheckup: daysAgo(8),
    notes: 'Dairy goat, consistent milking pattern.',
  },
  {
    id: 'ANM-011',
    name: 'Duke',
    species: 'Cattle',
    breed: 'Angus',
    age: 3,
    sex: 'Male',
    weight: 700,
    identificationNumber: 'TAG-20231105',
    status: 'monitored',
    deviceId: 'DEV-009',
    location: 'Pasture E',
    registeredAt: daysAgo(20),
    lastCheckup: daysAgo(3),
    notes: 'Breeding bull under stress monitoring.',
  },
  {
    id: 'ANM-012',
    name: 'Rosie',
    species: 'Pig',
    breed: 'Duroc',
    age: 2,
    sex: 'Female',
    weight: 130,
    identificationNumber: 'TAG-20231120',
    status: 'normal',
    deviceId: null,
    location: 'Pen F',
    registeredAt: daysAgo(10),
    lastCheckup: daysAgo(10),
    notes: 'Recently registered. Awaiting device assignment.',
  },
];

// ── IoT Devices ─────────────────────────────────────────────────────────────
export const mockDevices = [
  {
    id: 'DEV-001',
    name: 'Collar Sensor A1',
    type: 'Collar Sensor',
    sensorType: 'Temperature, Accelerometer',
    assignedAnimalId: 'ANM-001',
    assignedAnimalName: 'Bella',
    status: 'online',
    batteryLevel: 87,
    firmwareVersion: '2.1.4',
    lastCommunication: minutesAgo(3),
    installedAt: daysAgo(300),
  },
  {
    id: 'DEV-002',
    name: 'Leg Band T1',
    type: 'Leg Band',
    sensorType: 'Accelerometer, Heart Rate',
    assignedAnimalId: 'ANM-002',
    assignedAnimalName: 'Thunder',
    status: 'online',
    batteryLevel: 72,
    firmwareVersion: '2.1.4',
    lastCommunication: minutesAgo(5),
    installedAt: daysAgo(250),
  },
  {
    id: 'DEV-003',
    name: 'Ear Tag W1',
    type: 'Ear Tag Sensor',
    sensorType: 'Temperature, GPS',
    assignedAnimalId: 'ANM-003',
    assignedAnimalName: 'Woolly',
    status: 'online',
    batteryLevel: 93,
    firmwareVersion: '2.0.8',
    lastCommunication: minutesAgo(1),
    installedAt: daysAgo(200),
  },
  {
    id: 'DEV-004',
    name: 'Collar Sensor A2',
    type: 'Collar Sensor',
    sensorType: 'Temperature, Accelerometer',
    assignedAnimalId: 'ANM-004',
    assignedAnimalName: 'Daisy',
    status: 'online',
    batteryLevel: 65,
    firmwareVersion: '2.1.4',
    lastCommunication: minutesAgo(8),
    installedAt: daysAgo(180),
  },
  {
    id: 'DEV-005',
    name: 'Collar Sensor R1',
    type: 'Collar Sensor',
    sensorType: 'Temperature, Accelerometer, Heart Rate',
    assignedAnimalId: 'ANM-005',
    assignedAnimalName: 'Rocky',
    status: 'offline',
    batteryLevel: 12,
    firmwareVersion: '2.0.8',
    lastCommunication: hoursAgo(6),
    installedAt: daysAgo(160),
  },
  {
    id: 'DEV-006',
    name: 'Belly Band B1',
    type: 'Belly Band',
    sensorType: 'Temperature, Accelerometer',
    assignedAnimalId: 'ANM-007',
    assignedAnimalName: 'Babe',
    status: 'online',
    batteryLevel: 81,
    firmwareVersion: '2.1.4',
    lastCommunication: minutesAgo(2),
    installedAt: daysAgo(100),
  },
  {
    id: 'DEV-007',
    name: 'Leg Band S1',
    type: 'Leg Band',
    sensorType: 'Accelerometer, Heart Rate',
    assignedAnimalId: 'ANM-008',
    assignedAnimalName: 'Shadow',
    status: 'warning',
    batteryLevel: 34,
    firmwareVersion: '2.0.8',
    lastCommunication: minutesAgo(45),
    installedAt: daysAgo(80),
  },
  {
    id: 'DEV-008',
    name: 'Ear Tag BT1',
    type: 'Ear Tag Sensor',
    sensorType: 'Temperature, GPS',
    assignedAnimalId: 'ANM-010',
    assignedAnimalName: 'Buttercup',
    status: 'online',
    batteryLevel: 90,
    firmwareVersion: '2.1.4',
    lastCommunication: minutesAgo(4),
    installedAt: daysAgo(35),
  },
  {
    id: 'DEV-009',
    name: 'Collar Sensor D1',
    type: 'Collar Sensor',
    sensorType: 'Temperature, Accelerometer, Heart Rate',
    assignedAnimalId: 'ANM-011',
    assignedAnimalName: 'Duke',
    status: 'online',
    batteryLevel: 95,
    firmwareVersion: '2.1.4',
    lastCommunication: minutesAgo(1),
    installedAt: daysAgo(18),
  },
  {
    id: 'DEV-010',
    name: 'Collar Sensor X1',
    type: 'Collar Sensor',
    sensorType: 'Temperature, Accelerometer',
    assignedAnimalId: null,
    assignedAnimalName: null,
    status: 'offline',
    batteryLevel: 0,
    firmwareVersion: '1.9.2',
    lastCommunication: daysAgo(30),
    installedAt: daysAgo(400),
  },
];

// ── Sensor Readings (last 24 hours, per animal) ─────────────────────────────
const generateSensorReadings = (animalId, deviceId, hours = 24) => {
  const readings = [];
  for (let i = hours; i >= 0; i--) {
    readings.push({
      id: `SR-${animalId}-${i}`,
      animalId,
      deviceId,
      timestamp: hoursAgo(i),
      temperature: randomFloat(37.5, 40.0),
      activityLevel: randomBetween(10, 95),
      heartRate: randomBetween(40, 120),
      humidity: randomFloat(40, 80),
    });
  }
  return readings;
};

export const mockSensorReadings = {
  'ANM-001': generateSensorReadings('ANM-001', 'DEV-001'),
  'ANM-002': generateSensorReadings('ANM-002', 'DEV-002'),
  'ANM-003': generateSensorReadings('ANM-003', 'DEV-003'),
  'ANM-004': generateSensorReadings('ANM-004', 'DEV-004'),
  'ANM-005': generateSensorReadings('ANM-005', 'DEV-005'),
  'ANM-007': generateSensorReadings('ANM-007', 'DEV-006'),
  'ANM-008': generateSensorReadings('ANM-008', 'DEV-007'),
  'ANM-010': generateSensorReadings('ANM-010', 'DEV-008'),
  'ANM-011': generateSensorReadings('ANM-011', 'DEV-009'),
};

// ── Behavioral Predictions ──────────────────────────────────────────────────
// These are EXAMPLE predictions from a DEMO model. They do NOT represent
// confirmed veterinary diagnoses or validated ML outputs.
const generatePredictions = (animalId, days = 7) => {
  const preds = [];
  for (let d = days; d >= 0; d--) {
    for (let h = 0; h < 24; h += 3) {
      const behavior =
        behaviorCategories[randomBetween(0, behaviorCategories.length - 1)];
      preds.push({
        id: `PRED-${animalId}-${d}-${h}`,
        animalId,
        timestamp: (() => {
          const dt = new Date(now);
          dt.setDate(dt.getDate() - d);
          dt.setHours(h, 0, 0, 0);
          return dt.toISOString();
        })(),
        predictedBehavior: behavior,
        confidence: behavior === 'Abnormal' ? randomFloat(0.55, 0.85) : randomFloat(0.75, 0.98),
        sensorSnapshot: {
          temperature: randomFloat(37.5, 40.0),
          activityLevel: randomBetween(10, 95),
          heartRate: randomBetween(40, 120),
        },
      });
    }
  }
  return preds;
};

export const mockPredictions = {
  'ANM-001': generatePredictions('ANM-001'),
  'ANM-002': generatePredictions('ANM-002'),
  'ANM-003': generatePredictions('ANM-003'),
  'ANM-004': generatePredictions('ANM-004'),
  'ANM-005': generatePredictions('ANM-005'),
  'ANM-007': generatePredictions('ANM-007'),
  'ANM-008': generatePredictions('ANM-008'),
  'ANM-010': generatePredictions('ANM-010'),
  'ANM-011': generatePredictions('ANM-011'),
};

// ── Alerts ──────────────────────────────────────────────────────────────────
export const mockAlerts = [
  {
    id: 'ALR-001',
    animalId: 'ANM-008',
    animalName: 'Shadow',
    type: 'Abnormal Behavior',
    severity: 'critical',
    title: 'Prolonged Inactivity Detected',
    description:
      'Shadow has shown significantly reduced activity over the past 6 hours compared to the normal baseline. This may indicate distress or health issues.',
    timestamp: hoursAgo(2),
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'ALR-002',
    animalId: 'ANM-005',
    animalName: 'Rocky',
    type: 'Device Issue',
    severity: 'warning',
    title: 'Low Battery on Device DEV-005',
    description:
      'The collar sensor assigned to Rocky has a battery level of 12%. Replace or recharge the device soon.',
    timestamp: hoursAgo(5),
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'ALR-003',
    animalId: 'ANM-001',
    animalName: 'Bella',
    type: 'Temperature',
    severity: 'warning',
    title: 'Elevated Body Temperature',
    description:
      'Bella\'s temperature reading was 39.8°C, which is above the normal range for cattle. Monitor closely.',
    timestamp: hoursAgo(8),
    acknowledged: true,
    acknowledgedAt: hoursAgo(6),
    acknowledgedBy: 'Dr. Smith',
  },
  {
    id: 'ALR-004',
    animalId: 'ANM-002',
    animalName: 'Thunder',
    type: 'Abnormal Behavior',
    severity: 'critical',
    title: 'Unusual Nighttime Activity',
    description:
      'Thunder exhibited high activity levels during typical resting hours (2 AM – 4 AM). This pattern is atypical.',
    timestamp: hoursAgo(18),
    acknowledged: true,
    acknowledgedAt: hoursAgo(12),
    acknowledgedBy: 'Stable Manager',
  },
  {
    id: 'ALR-005',
    animalId: 'ANM-007',
    animalName: 'Babe',
    type: 'Heart Rate',
    severity: 'warning',
    title: 'Irregular Heart Rate Pattern',
    description:
      'Heart rate readings for Babe showed irregular spikes over the past 4 hours. Further veterinary review recommended.',
    timestamp: hoursAgo(3),
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'ALR-006',
    animalId: 'ANM-011',
    animalName: 'Duke',
    type: 'Activity',
    severity: 'info',
    title: 'Activity Level Spike',
    description:
      'Duke showed a sharp increase in activity during feeding time. This is likely normal but logged for reference.',
    timestamp: hoursAgo(10),
    acknowledged: true,
    acknowledgedAt: hoursAgo(9),
    acknowledgedBy: 'Farm Hand',
  },
  {
    id: 'ALR-007',
    animalId: 'ANM-004',
    animalName: 'Daisy',
    type: 'Device Issue',
    severity: 'info',
    title: 'Firmware Update Available',
    description:
      'A firmware update (v2.2.0) is available for Daisy\'s collar sensor DEV-004.',
    timestamp: daysAgo(1),
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'ALR-008',
    animalId: 'ANM-003',
    animalName: 'Woolly',
    type: 'Temperature',
    severity: 'critical',
    title: 'Hypothermia Risk',
    description:
      'Woolly\'s temperature dropped to 36.5°C, which is below the normal range for sheep. Immediate attention may be required.',
    timestamp: daysAgo(2),
    acknowledged: true,
    acknowledgedAt: daysAgo(2),
    acknowledgedBy: 'Dr. Jones',
  },
  {
    id: 'ALR-009',
    animalId: 'ANM-010',
    animalName: 'Buttercup',
    type: 'Abnormal Behavior',
    severity: 'warning',
    title: 'Feeding Pattern Change',
    description:
      'Buttercup\'s feeding pattern has shifted significantly. Reduced feeding time observed for 2 consecutive days.',
    timestamp: daysAgo(1),
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'ALR-010',
    animalId: 'ANM-008',
    animalName: 'Shadow',
    type: 'Device Issue',
    severity: 'warning',
    title: 'Intermittent Connection',
    description:
      'Device DEV-007 assigned to Shadow is experiencing intermittent connectivity. Last reliable reading was 45 minutes ago.',
    timestamp: minutesAgo(45),
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
];

// ── Dashboard Summary ───────────────────────────────────────────────────────
export const mockDashboardSummary = {
  totalAnimals: mockAnimals.length,
  monitoredAnimals: mockAnimals.filter((a) => a.status === 'monitored').length,
  normalBehavior: 7,
  abnormalAlerts: mockAlerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length,
  devicesOnline: mockDevices.filter((d) => d.status === 'online').length,
  devicesOffline: mockDevices.filter((d) => d.status === 'offline').length,
  devicesWarning: mockDevices.filter((d) => d.status === 'warning').length,
  totalDevices: mockDevices.length,
};

// ── Dashboard Charts ────────────────────────────────────────────────────────
export const mockBehaviorDistribution = [
  { name: 'Resting', value: 35, color: '#06b6d4' },
  { name: 'Active', value: 25, color: '#10b981' },
  { name: 'Feeding', value: 20, color: '#f59e0b' },
  { name: 'Walking', value: 15, color: '#8b5cf6' },
  { name: 'Abnormal', value: 5, color: '#ef4444' },
];

export const mockSensorTrends = (() => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: `${String(new Date(hoursAgo(i)).getHours()).padStart(2, '0')}:00`,
      avgTemperature: randomFloat(37.8, 39.5),
      avgActivity: randomBetween(20, 80),
      avgHeartRate: randomBetween(50, 100),
    });
  }
  return data;
})();

// ── Reports ─────────────────────────────────────────────────────────────────
export const mockReportSummary = {
  daily: {
    date: new Date().toISOString().split('T')[0],
    totalReadings: 288,
    avgTemperature: 38.6,
    avgActivity: 52,
    avgHeartRate: 72,
    alertsTriggered: 3,
    alertsAcknowledged: 1,
    behaviorBreakdown: { Resting: 40, Active: 25, Feeding: 18, Walking: 12, Abnormal: 5 },
  },
  weekly: {
    startDate: daysAgo(7).split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalReadings: 2016,
    avgTemperature: 38.5,
    avgActivity: 48,
    avgHeartRate: 70,
    alertsTriggered: 18,
    alertsAcknowledged: 12,
    behaviorBreakdown: { Resting: 38, Active: 27, Feeding: 19, Walking: 11, Abnormal: 5 },
  },
  monthly: {
    startDate: daysAgo(30).split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalReadings: 8640,
    avgTemperature: 38.4,
    avgActivity: 50,
    avgHeartRate: 71,
    alertsTriggered: 64,
    alertsAcknowledged: 52,
    behaviorBreakdown: { Resting: 36, Active: 26, Feeding: 20, Walking: 13, Abnormal: 5 },
  },
};

export const mockWeeklyTrend = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({
    day,
    temperature: randomFloat(37.8, 39.2),
    activity: randomBetween(30, 70),
    heartRate: randomBetween(55, 85),
    alerts: randomBetween(0, 5),
  }));
})();

// ── Mock Auth ───────────────────────────────────────────────────────────────
export const mockUser = {
  id: 1,
  username: 'admin',
  name: 'Shirshail',
  email: 'shirshail@animalwatch.io',
  role: 'Farm Administrator',
  avatar: null,
};

export const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'demo123',
};
