// =============================================================================
// Device Service — API layer for IoT device management
// =============================================================================
// Provisional endpoints (confirm with backend developer):
//   GET    /devices            — list all devices
//   GET    /devices/:id        — single device
//   POST   /devices            — register a new device
//   PUT    /devices/:id        — update device details
//   PUT    /devices/:id/assign — assign device to an animal
//   PUT    /devices/:id/unassign — unassign device from animal
//   DELETE /devices/:id        — remove a device
// =============================================================================

import api, { useMockData } from './api';
import { mockDevices } from '../mock/mockData';

let demoDevices = [...mockDevices];

export const getDevices = async () => {
  if (useMockData()) return { data: demoDevices };
  const response = await api.get('/devices');
  return response;
};

export const getDeviceById = async (id) => {
  if (useMockData()) {
    const device = demoDevices.find((d) => d.id === id);
    if (!device) throw new Error(`Device ${id} not found`);
    return { data: device };
  }
  const response = await api.get(`/devices/${id}`);
  return response;
};

export const createDevice = async (data) => {
  if (useMockData()) {
    const newDevice = {
      ...data,
      id: `DEV-${String(demoDevices.length + 1).padStart(3, '0')}`,
      status: 'offline',
      batteryLevel: 100,
      firmwareVersion: '2.1.4',
      lastCommunication: null,
      installedAt: new Date().toISOString(),
    };
    demoDevices = [newDevice, ...demoDevices];
    return { data: newDevice };
  }
  const response = await api.post('/devices', data);
  return response;
};

export const updateDevice = async (id, data) => {
  if (useMockData()) {
    demoDevices = demoDevices.map((d) => (d.id === id ? { ...d, ...data } : d));
    return { data: demoDevices.find((d) => d.id === id) };
  }
  const response = await api.put(`/devices/${id}`, data);
  return response;
};

export const assignDevice = async (deviceId, animalId, animalName) => {
  if (useMockData()) {
    demoDevices = demoDevices.map((d) =>
      d.id === deviceId
        ? { ...d, assignedAnimalId: animalId, assignedAnimalName: animalName }
        : d,
    );
    return { data: demoDevices.find((d) => d.id === deviceId) };
  }
  const response = await api.put(`/devices/${deviceId}/assign`, { animalId });
  return response;
};

export const unassignDevice = async (deviceId) => {
  if (useMockData()) {
    demoDevices = demoDevices.map((d) =>
      d.id === deviceId
        ? { ...d, assignedAnimalId: null, assignedAnimalName: null }
        : d,
    );
    return { data: demoDevices.find((d) => d.id === deviceId) };
  }
  const response = await api.put(`/devices/${deviceId}/unassign`);
  return response;
};

export const resetDemoDevices = () => {
  demoDevices = [...mockDevices];
};
