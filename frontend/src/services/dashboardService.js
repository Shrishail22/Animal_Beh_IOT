// =============================================================================
// Dashboard Service — Centralized API layer for Main Dashboard
// =============================================================================
// Provisional endpoint (confirm with backend developer):
//   GET /dashboard/summary?species=XX&animalId=XX&timeframe=XX
//
// Returns:
//   {
//     totalAnimals: number,
//     monitoredAnimals: number,
//     normalBehavior: number,
//     abnormalAlerts: number,
//     devicesOnline: number,
//     devicesOffline: number,
//     devicesWarning: number,
//     totalDevices: number,
//     behaviorDistribution: [{ name: string, value: number, color: string }],
//     sensorTrends: [{ time: string, avgTemperature: number, avgActivity: number, avgHeartRate: number }],
//     recentAlerts: Alert[],
//     recentReadings: SensorReading[]
//   }
// =============================================================================

import api, { useMockData } from './api';
import {
  mockDashboardSummary,
  mockBehaviorDistribution,
  mockSensorTrends,
  mockAlerts,
  mockSensorReadings,
  mockAnimals,
} from '../mock/mockData';

export const getDashboardSummary = async (filters = {}) => {
  if (useMockData()) {
    // Return mock data for demo mode
    const allReadings = [];
    Object.entries(mockSensorReadings).forEach(([anmId, list]) => {
      const animal = mockAnimals.find((a) => a.id === anmId);
      list.forEach((r) => {
        allReadings.push({
          ...r,
          animalName: animal?.name || anmId,
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
        recentReadings: allReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      },
    };
  }

  // Real API call in API mode
  const response = await api.get('/dashboard/summary', { params: filters });
  return response;
};
