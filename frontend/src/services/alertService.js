// =============================================================================
// Alert Service — API layer for alerts and notifications
// =============================================================================
// Provisional endpoints (confirm with backend developer):
//   GET  /alerts                    — list all alerts
//   GET  /alerts/:id                — single alert detail
//   PUT  /alerts/:id/acknowledge    — mark alert as acknowledged
// =============================================================================

import api, { useMockData } from './api';
import { mockAlerts } from '../mock/mockData';

let demoAlerts = [...mockAlerts];

export const getAlerts = async () => {
  if (useMockData()) return { data: demoAlerts };
  const response = await api.get('/alerts');
  return response;
};

export const getAlertById = async (id) => {
  if (useMockData()) {
    const alert = demoAlerts.find((a) => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    return { data: alert };
  }
  const response = await api.get(`/alerts/${id}`);
  return response;
};

export const acknowledgeAlert = async (id, acknowledgedBy = 'Shirshail') => {
  if (useMockData()) {
    demoAlerts = demoAlerts.map((a) =>
      a.id === id
        ? {
            ...a,
            acknowledged: true,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy,
          }
        : a,
    );
    return { data: demoAlerts.find((a) => a.id === id) };
  }
  const response = await api.put(`/alerts/${id}/acknowledge`, { acknowledgedBy });
  return response;
};

export const resetDemoAlerts = () => {
  demoAlerts = [...mockAlerts];
};
