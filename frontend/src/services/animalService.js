// =============================================================================
// Animal Service — React frontend <-> FastAPI backend
// Database: MySQL
// =============================================================================

import api, { useMockData } from './api';
import { mockAnimals } from '../mock/mockData';

let demoAnimals = [...mockAnimals];

// Convert date of birth into age in years
const calculateAge = (dob) => {
  if (!dob) return '';

  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate());

  if (beforeBirthday) age -= 1;

  return Math.max(0, age);
};

// Convert database animal format into the existing React UI format
const toFrontendAnimal = (animal) => {
  const deviceId = animal.device_id ?? animal.deviceId ?? null;
  const backendStatus = String(animal.status || 'ACTIVE').toUpperCase();

  let status = 'normal';

  if (backendStatus === 'INACTIVE' || backendStatus === 'REMOVED') {
    status = 'inactive';
  } else if (deviceId) {
    status = 'monitored';
  }

  return {
    ...animal,
    id: animal.id,
    name: animal.name,
    species: animal.species,
    breed: animal.breed || '',
    age: calculateAge(animal.date_of_birth),
    sex: String(animal.gender || 'UNKNOWN').toLowerCase() === 'male'
      ? 'Male'
      : String(animal.gender || '').toLowerCase() === 'female'
        ? 'Female'
        : 'Unknown',
    weight: animal.weight_kg ?? '',
    identificationNumber: animal.animal_code || '',
    deviceId,
    status,
    registeredAt: animal.created_at || null,
  };
};

// Convert existing React form format into FastAPI request format
const toBackendAnimal = (data) => {
  const payload = {};

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.species !== undefined) payload.species = data.species;
  if (data.breed !== undefined) payload.breed = data.breed || null;

  if (data.identificationNumber !== undefined) {
    payload.animal_code = data.identificationNumber.trim();
  }

  if (data.sex !== undefined) {
    const gender = String(data.sex).toUpperCase();
    payload.gender = ['MALE', 'FEMALE'].includes(gender)
      ? gender
      : 'UNKNOWN';
  }

  if (data.weight !== undefined) {
    payload.weight_kg =
      data.weight === '' || data.weight === null
        ? null
        : Number(data.weight);
  }

  // The database stores date of birth, not age.
  // On creation, estimate birth date from the entered age.
  if (data.age !== undefined && data.age !== '') {
    const age = Number(data.age);

    if (Number.isFinite(age) && age >= 0) {
      const birth = new Date();
      birth.setFullYear(birth.getFullYear() - Math.floor(age));
      payload.date_of_birth = birth.toISOString().slice(0, 10);
    }
  }

  return payload;
};

// GET all animals
export const getAnimals = async () => {
  if (useMockData()) {
    return { data: demoAnimals };
  }

  const response = await api.get('/animals/');
  return {
    ...response,
    data: (response.data.animals || []).map(toFrontendAnimal),
  };
};

// GET one animal
export const getAnimalById = async (id) => {
  if (useMockData()) {
    const animal = demoAnimals.find(
      (item) => String(item.id) === String(id)
    );

    if (!animal) throw new Error('Animal not found: ' + id);

    return { data: animal };
  }

  const response = await api.get('/animals/' + id);
  return {
    ...response,
    data: toFrontendAnimal(response.data),
  };
};

// CREATE animal
export const createAnimal = async (data) => {
  if (useMockData()) {
    const newAnimal = {
      ...data,
      id: 'ANM-' + String(demoAnimals.length + 1).padStart(3, '0'),
      registeredAt: new Date().toISOString(),
      lastCheckup: null,
      status: data.deviceId ? 'monitored' : 'normal',
    };

    demoAnimals = [newAnimal, ...demoAnimals];
    return { data: newAnimal };
  }

  const response = await api.post('/animals/', toBackendAnimal(data));

  return {
    ...response,
    data: toFrontendAnimal(response.data),
  };
};

// UPDATE animal
export const updateAnimal = async (id, data) => {
  if (useMockData()) {
    const index = demoAnimals.findIndex(
      (animal) => String(animal.id) === String(id)
    );

    if (index === -1) throw new Error('Animal not found: ' + id);

    demoAnimals[index] = { ...demoAnimals[index], ...data };
    return { data: demoAnimals[index] };
  }

  const response = await api.put(
    '/animals/' + id,
    toBackendAnimal(data)
  );

  return {
    ...response,
    data: toFrontendAnimal(response.data),
  };
};

// DEACTIVATE animal (the backend does not permanently delete records)
export const deleteAnimal = async (id) => {
  if (useMockData()) {
    demoAnimals = demoAnimals.filter(
      (animal) => String(animal.id) !== String(id)
    );

    return { data: { success: true } };
  }

  return api.patch('/animals/' + id + '/deactivate');
};

// RESET demo data
export const resetDemoAnimals = () => {
  demoAnimals = [...mockAnimals];
};
