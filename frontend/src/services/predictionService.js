// =============================================================================
// Prediction Service — API layer for ML behavioral predictions
// =============================================================================

import api, { useMockData } from './api';
import { mockPredictions } from '../mock/mockData';

const normalizeBehavior = (raw) => {
  if (!raw) return 'Active';
  const str = String(raw).toUpperCase().trim();
  if (str === 'REST' || str === 'RESTING' || str === 'LOW_ACTIVITY') return 'Resting';
  if (str === 'NORMAL' || str === 'ACTIVE' || str === 'HIGH_ACTIVITY') return 'Active';
  if (str === 'FEEDING' || str === 'EATING' || str === 'GRAZING') return 'Feeding';
  if (str === 'WALKING' || str === 'RUNNING') return 'Walking';
  if (str === 'ABNORMAL' || str === 'CRITICAL' || str === 'ANOMALY') return 'Abnormal';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
};

export const toFrontendPrediction = (p) => ({
  ...p,
  id: p.id,
  animalId: p.animal_id ?? p.animalId,
  readingId: p.reading_id ?? p.readingId,
  predictedBehavior: normalizeBehavior(p.predicted_behavior ?? p.predictedBehavior),
  confidence: Number(p.confidence) || 0.85,
  riskLevel: p.risk_level ?? p.riskLevel ?? 'LOW',
  modelVersion: p.model_version ?? p.modelVersion ?? 'RULE_BASELINE_v1',
  timestamp: p.predicted_at ?? p.timestamp ?? new Date().toISOString(),
});

export const getPredictions = async (animalId, _from, _to) => {
  if (useMockData()) {
    const preds = mockPredictions[animalId] || [];
    return { data: preds };
  }

  const params = {};
  if (animalId && animalId !== 'all') {
    const numeric = Number(String(animalId).replace(/\D/g, ''));
    if (numeric > 0) params.animal_id = numeric;
  }

  const response = await api.get('/predictions/', { params });
  const rawList = response.data.predictions || response.data || [];
  return {
    ...response,
    data: rawList.map(toFrontendPrediction),
  };
};

export const getLatestPrediction = async (animalId) => {
  if (useMockData()) {
    const preds = mockPredictions[animalId] || [];
    return { data: preds[preds.length - 1] || null };
  }

  const res = await getPredictions(animalId);
  const list = res.data || [];
  return { data: list.length > 0 ? list[0] : null };
};
