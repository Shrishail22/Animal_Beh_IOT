
import api, { useMockData } from './api';

import {
  mockDashboardSummary,
  mockBehaviorDistribution,
  mockSensorTrends,
  mockAlerts,
  mockSensorReadings,
  mockAnimals,
} from '../mock/mockData';

const normalizeDashboardResponse = (response) => {
  const raw = response.data ?? response;
  const summary = raw.summary ?? {};

  const behaviorColors = {
    NORMAL: '#22c55e',
    LOW_ACTIVITY: '#eab308',
    HIGH_ACTIVITY: '#f97316',
    ABNORMAL: '#ef4444',
  };

  const behaviorDistribution = Object.entries(
    raw.behavior_distribution ?? {}
  ).map(([name, value]) => ({
    name,
    value,
    color: behaviorColors[name] ?? '#94a3b8',
  }));

  const recentAlerts = (raw.recent_alerts ?? []).map((alert) => ({
    ...alert,
    animalName: alert.animal_name,
    alertType: alert.alert_type,
    timestamp: alert.created_at,
  }));

  const recentReadings = (raw.recent_readings ?? []).map((reading) => ({
    ...reading,
    animalName: reading.animal_name,
    animalCode: reading.animal_code,
    deviceCode: reading.device_code,
    avgTemperature: reading.temperature,
    avgActivity: reading.movement,
    timestamp: reading.recorded_at,
  }));

  return {
    data: {
      totalAnimals: summary.total_animals ?? 0,
      monitoredAnimals: summary.active_animals ?? 0,
      normalBehavior: raw.behavior_distribution?.NORMAL ?? 0,
      abnormalAlerts: summary.open_alerts ?? 0,

      devicesOnline: summary.online_devices ?? 0,
      devicesOffline: summary.offline_devices ?? 0,
      devicesWarning: summary.maintenance_devices ?? 0,
      totalDevices: summary.total_devices ?? 0,

      behaviorDistribution,
      // The backend does not yet provide time-series trends.
      sensorTrends: [],
      recentAlerts,
      recentReadings,
    },
  };
};

export const getDashboardSummary = async (filters = {}) => {
  if (useMockData()) {
    const allReadings = [];

    Object.entries(mockSensorReadings).forEach(([animalId, list]) => {
      const animal = mockAnimals.find(
        (item) => String(item.id) === String(animalId)
      );

      list.forEach((reading) => {
        allReadings.push({
          ...reading,
          animalName: animal?.name || animalId,
          species: animal?.species || '—',
        });
      });
    });

    return {
      data: {
        totalAnimals: mockDashboardSummary.totalAnimals,
        monitoredAnimals: mockDashboardSummary.monitoredAnimals,
        normalBehavior: mockDashboardSummary.normalBehavior,
        abnormalAlerts: mockDashboardSummary.abnormalAlerts,
        devicesOnline: mockDashboardSummary.devicesOnline,
        devicesOffline: mockDashboardSummary.devicesOffline,
        devicesWarning: mockDashboardSummary.devicesWarning,
        totalDevices: mockDashboardSummary.totalDevices,
        behaviorDistribution: mockBehaviorDistribution,
        sensorTrends: mockSensorTrends,
        recentAlerts: mockAlerts.slice(0, 5),
        recentReadings: allReadings.sort(
          (a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        ),
      },
    };
  }

  const response = await api.get('/dashboard/summary', {
    params: filters,
  });

  return normalizeDashboardResponse(response);
};
