// =============================================================================
// Alert Service — API layer for alerts and notifications
// =============================================================================

import api, { useMockData } from './api';
import { mockAlerts } from '../mock/mockData';

let demoAlerts = [...mockAlerts];

export const toFrontendAlert = (alert) => {
  const isAck = alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED';
  const severityMap = {
    CRITICAL: 'critical',
    HIGH: 'critical',
    MEDIUM: 'warning',
    LOW: 'info',
  };
  return {
    ...alert,
    id: alert.id,
    animalId: alert.animal_id ?? alert.animalId,
    animalName: alert.animal_name ?? alert.animalName ?? `Animal #${alert.animal_id || ''}`,
    type: alert.alert_type ?? alert.type ?? 'ABNORMAL_BEHAVIOR',
    severity: severityMap[alert.severity] || (alert.severity ? alert.severity.toLowerCase() : 'warning'),
    title: alert.title ?? (alert.alert_type ? alert.alert_type.replace(/_/g, ' ') : 'Behavior Alert'),
    description: alert.message ?? alert.description ?? 'Unusual sensor pattern detected.',
    status: (alert.status ?? 'OPEN').toLowerCase(),
    acknowledged: isAck || alert.acknowledged === true,
    acknowledgedBy: alert.acknowledgedBy ?? (alert.status === 'ACKNOWLEDGED' ? 'Supervisor' : null),
    acknowledgedAt: alert.resolved_at ?? alert.acknowledgedAt ?? alert.created_at,
    timestamp: alert.created_at ?? alert.timestamp ?? new Date().toISOString(),
  };
};

export const getAlerts = async (filters = {}) => {
  if (useMockData()) {
    return { data: demoAlerts };
  }

  const response = await api.get('/alerts/', { params: filters });
  const rawList = response.data.alerts || response.data || [];
  return {
    ...response,
    data: rawList.map(toFrontendAlert),
  };
};

export const getAlertById = async (id) => {
  if (useMockData()) {
    const alert = demoAlerts.find((a) => String(a.id) === String(id));
    if (!alert) throw new Error(`Alert ${id} not found`);
    return { data: alert };
  }

  const response = await api.get(`/alerts/${id}`);
  return {
    ...response,
    data: toFrontendAlert(response.data),
  };
};

export const acknowledgeAlert = async (id, acknowledgedBy = 'Supervisor') => {
  if (useMockData()) {
    demoAlerts = demoAlerts.map((a) =>
      String(a.id) === String(id)
        ? {
            ...a,
            acknowledged: true,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy,
          }
        : a,
    );
    return { data: demoAlerts.find((a) => String(a.id) === String(id)) };
  }

  const response = await api.patch(`/alerts/${id}/acknowledge`);
  return {
    ...response,
    data: toFrontendAlert(response.data),
  };
};

export const resolveAlert = async (id) => {
  if (useMockData()) {
    demoAlerts = demoAlerts.map((a) =>
      String(a.id) === String(id)
        ? {
            ...a,
            status: 'resolved',
            acknowledged: true,
            resolvedAt: new Date().toISOString(),
          }
        : a,
    );
    return { data: demoAlerts.find((a) => String(a.id) === String(id)) };
  }

  const response = await api.patch(`/alerts/${id}/resolve`);
  return {
    ...response,
    data: toFrontendAlert(response.data),
  };
};

export const resetDemoAlerts = () => {
  demoAlerts = [...mockAlerts];
};
