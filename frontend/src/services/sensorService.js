// =============================================================================
// Sensor Service — API layer for sensor / live-monitoring data
// =============================================================================
// Provisional endpoints (confirm with backend developer):
//   GET /sensors/readings?animalId=XX&from=ISO&to=ISO  — historical readings
//   GET /sensors/latest?animalId=XX                    — latest snapshot
// =============================================================================

import api, { useMockData } from './api';
import { mockSensorReadings } from '../mock/mockData';

export const getSensorReadings = async (animalId, _from, _to) => {
  if (useMockData()) {
    const readings = mockSensorReadings[animalId] || [];
    return { data: readings };
  }
  const response = await api.get('/sensors/readings', {
    params: { animalId, from: _from, to: _to },
  });
  return response;
};

export const getLatestReading = async (animalId) => {
  if (useMockData()) {
    const readings = mockSensorReadings[animalId] || [];
    return { data: readings[readings.length - 1] || null };
  }
  const response = await api.get('/sensors/latest', {
    params: { animalId },
  });
  return response;
};
