// =============================================================================
// Animal Service — API layer for animal CRUD operations
// =============================================================================
// Provisional endpoints (confirm with backend developer):
//   GET    /animals            — list all animals
//   GET    /animals/:id        — get single animal
//   POST   /animals            — create a new animal
//   PUT    /animals/:id        — update an animal
//   DELETE /animals/:id        — delete an animal
// =============================================================================

import api, { useMockData } from './api';
import { mockAnimals } from '../mock/mockData';

// In-memory copy so demo add/edit persists during the session
let demoAnimals = [...mockAnimals];

export const getAnimals = async () => {
  if (useMockData()) return { data: demoAnimals };
  const response = await api.get('/animals');
  return response;
};

export const getAnimalById = async (id) => {
  if (useMockData()) {
    const animal = demoAnimals.find((a) => a.id === id);
    if (!animal) throw new Error(`Animal ${id} not found`);
    return { data: animal };
  }
  const response = await api.get(`/animals/${id}`);
  return response;
};

export const createAnimal = async (data) => {
  if (useMockData()) {
    const newAnimal = {
      ...data,
      id: `ANM-${String(demoAnimals.length + 1).padStart(3, '0')}`,
      registeredAt: new Date().toISOString(),
      lastCheckup: null,
      status: data.deviceId ? 'monitored' : 'normal',
    };
    demoAnimals = [newAnimal, ...demoAnimals];
    return { data: newAnimal };
  }
  const response = await api.post('/animals', data);
  return response;
};

export const updateAnimal = async (id, data) => {
  if (useMockData()) {
    demoAnimals = demoAnimals.map((a) => (a.id === id ? { ...a, ...data } : a));
    return { data: demoAnimals.find((a) => a.id === id) };
  }
  const response = await api.put(`/animals/${id}`, data);
  return response;
};

export const deleteAnimal = async (id) => {
  if (useMockData()) {
    demoAnimals = demoAnimals.filter((a) => a.id !== id);
    return { data: { success: true } };
  }
  const response = await api.delete(`/animals/${id}`);
  return response;
};

/** Reset demo data (useful for testing) */
export const resetDemoAnimals = () => {
  demoAnimals = [...mockAnimals];
};
