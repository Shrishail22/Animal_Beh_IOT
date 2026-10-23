// =============================================================================
// Sensor Service — API layer for sensor / live-monitoring data
// =============================================================================

import api, { useMockData } from './api';
import { mockSensorReadings } from '../mock/mockData';

export const toFrontendReading = (r) => ({
  ...r,
  id: r.id,
  deviceId: r.device_id ?? r.deviceId,
  animalId: r.animal_id ?? r.animalId,
  temperature: Number(r.temperature) || 38.2,
  activityLevel: Number(r.movement) || 0,
  movement: Number(r.movement) || 0,
  heartRate: Number(r.activity_frequency) || (r.heartRate || 74),
  activityDuration: r.activity_duration ?? 0,
  restDuration: r.rest_duration ?? 0,
  activityFrequency: r.activity_frequency ?? 0,
  timestamp: r.recorded_at ?? r.timestamp ?? new Date().toISOString(),
});

export const getSensorReadings = async (animalId, _from, _to) => {
  if (useMockData()) {
    const readings = mockSensorReadings[animalId] || [];
    return { data: readings };
  }

  const params = {};
  if (animalId && animalId !== 'all') {
    const numeric = Number(String(animalId).replace(/\D/g, ''));
    if (numeric > 0) params.animal_id = numeric;
  }

  const response = await api.get('/sensor-readings/', { params });
  const rawList = response.data.readings || response.data || [];
  return {
    ...response,
    data: rawList.map(toFrontendReading),
  };
};

export const getLatestReading = async (animalId) => {
  if (useMockData()) {
    const readings = mockSensorReadings[animalId] || [];
    return { data: readings[readings.length - 1] || null };
  }

  const res = await getSensorReadings(animalId);
  const list = res.data || [];
  return { data: list.length > 0 ? list[0] : null };
};
