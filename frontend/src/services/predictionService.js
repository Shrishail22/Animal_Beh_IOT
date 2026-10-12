// =============================================================================
// Prediction Service — API layer for ML behavioral predictions
// =============================================================================
// Provisional endpoints (confirm with backend developer):
//   GET /predictions?animalId=XX&from=ISO&to=ISO — historical predictions
//   GET /predictions/latest?animalId=XX           — latest prediction
// =============================================================================

import api, { useMockData } from './api';
import { mockPredictions } from '../mock/mockData';

export const getPredictions = async (animalId, _from, _to) => {
  if (useMockData()) {
    const preds = mockPredictions[animalId] || [];
    return { data: preds };
  }
  const response = await api.get('/predictions', {
    params: { animalId, from: _from, to: _to },
  });
  return response;
};

export const getLatestPrediction = async (animalId) => {
  if (useMockData()) {
    const preds = mockPredictions[animalId] || [];
    return { data: preds[preds.length - 1] || null };
  }
  const response = await api.get('/predictions/latest', {
    params: { animalId },
  });
  return response;
};
