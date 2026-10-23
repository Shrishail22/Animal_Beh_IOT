// =============================================================================
// Report Service — API layer for reports and analytics
// =============================================================================

import api, { useMockData } from './api';
import {
  mockReportSummary, mockWeeklyTrend, mockAnimals, mockSensorReadings
} from '../mock/mockData';

export const getReportSummary = async (period = 'daily') => {
  if (useMockData()) {
    return { data: mockReportSummary[period] || mockReportSummary.daily };
  }
  const response = await api.get('/reports/summary', { params: { period } });
  return response;
};

export const getReportTrends = async (_period = 'weekly') => {
  if (useMockData()) {
    return { data: mockWeeklyTrend };
  }
  const response = await api.get('/reports/trends', { params: { period: _period } });
  return response;
};

export const getReportRecords = async (params = {}) => {
  if (useMockData()) {
    let rows = [];
    const animalId = params.animalId || 'all';
    if (animalId === 'all') {
      Object.entries(mockSensorReadings).forEach(([anmId, readings]) => {
        const animal = mockAnimals.find((a) => a.id === anmId);
        readings.forEach((r) => {
          rows.push({
            animalId: anmId,
            animalName: animal?.name || anmId,
            species: animal?.species || '—',
            timestamp: r.timestamp,
            temperature: r.temperature,
            activityLevel: r.activityLevel,
            heartRate: r.heartRate,
          });
        });
      });
    } else {
      const animal = mockAnimals.find((a) => a.id === animalId);
      const readings = mockSensorReadings[animalId] || [];
      rows = readings.map((r) => ({
        animalId,
        animalName: animal?.name || animalId,
        species: animal?.species || '—',
        timestamp: r.timestamp,
        temperature: r.temperature,
        activityLevel: r.activityLevel,
        heartRate: r.heartRate,
      }));
    }
    return { data: rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) };
  }

  const response = await api.get('/reports/records', { params });
  return response;
};

/**
 * Export data as CSV. In demo mode this generates the CSV on the frontend
 * from the provided rows. In API mode it downloads from the backend.
 */
export const exportCSV = async (rows, filename = 'report.csv') => {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to export.');
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(','),
    ),
  ];
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
};
