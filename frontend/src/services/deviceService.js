// =============================================================================
// Device Service — API layer for IoT device management
// =============================================================================

import api, { useMockData } from './api';
import { mockDevices } from '../mock/mockData';

let demoDevices = [...mockDevices];

export const toFrontendDevice = (d) => {
  const statusStr = (d.status || 'offline').toUpperCase();
  let uiStatus = 'offline';
  if (statusStr === 'ONLINE') uiStatus = 'online';
  else if (statusStr === 'MAINTENANCE') uiStatus = 'warning';

  return {
    ...d,
    id: d.id,
    deviceCode: d.device_code || d.deviceCode || `DEV-${d.id}`,
    name: d.name || d.device_code || `Collar-${d.id}`,
    type: d.device_type || d.type || 'Smart Collar Pro',
    sensorType: d.sensorType || 'Motion + Temp',
    status: uiStatus,
    batteryLevel: Number(d.battery_level ?? d.batteryLevel ?? 100),
    firmwareVersion: d.firmware_version || d.firmwareVersion || 'v2.1.4',
    assignedAnimalId: d.animal_id ? (d.animal_code || `ANM-${String(d.animal_id).padStart(3, '0')}`) : (d.assignedAnimalId ?? null),
    assignedAnimalName: d.animal_name || d.assignedAnimalName || (d.animal_id ? `Animal #${d.animal_id}` : null),
    rawAnimalId: d.animal_id ?? null,
    lastCommunication: d.last_seen || d.lastCommunication || d.updated_at,
  };
};

export const toBackendDevice = (data) => {
  const payload = {
    device_code: data.deviceCode || data.name || data.id || `DEV-${Date.now().toString().slice(-4)}`,
    device_type: data.type || data.deviceType || 'Smart Collar Pro',
    firmware_version: data.firmwareVersion || 'v2.1.4',
    battery_level: Number(data.batteryLevel) || 100,
  };

  if (data.animalId !== undefined && data.animalId !== null) {
    const numeric = Number(String(data.animalId).replace(/\D/g, ''));
    if (numeric > 0) payload.animal_id = numeric;
  }
  if (!payload.animal_id) payload.animal_id = 1; // Default assignment required by DB foreign key

  return payload;
};

export const getDevices = async (filters = {}) => {
  if (useMockData()) {
    return { data: demoDevices };
  }

  const response = await api.get('/devices/', { params: filters });
  const rawList = response.data.devices || response.data || [];
  return {
    ...response,
    data: rawList.map(toFrontendDevice),
  };
};

export const getDeviceById = async (id) => {
  if (useMockData()) {
    const device = demoDevices.find((d) => String(d.id) === String(id));
    if (!device) throw new Error(`Device ${id} not found`);
    return { data: device };
  }

  const response = await api.get(`/devices/${id}`);
  return {
    ...response,
    data: toFrontendDevice(response.data),
  };
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

  const response = await api.post('/devices/', toBackendDevice(data));
  return {
    ...response,
    data: toFrontendDevice(response.data),
  };
};

export const updateDevice = async (id, data) => {
  if (useMockData()) {
    demoDevices = demoDevices.map((d) => (String(d.id) === String(id) ? { ...d, ...data } : d));
    return { data: demoDevices.find((d) => String(d.id) === String(id)) };
  }

  const numericId = Number(String(id).replace(/\D/g, '')) || id;
  const updatePayload = {};
  if (data.type || data.deviceType) updatePayload.device_type = data.type || data.deviceType;
  if (data.firmwareVersion) updatePayload.firmware_version = data.firmwareVersion;
  if (data.batteryLevel !== undefined) updatePayload.battery_level = Number(data.batteryLevel);
  if (data.status) {
    const st = String(data.status).toUpperCase();
    if (st === 'WARNING') updatePayload.status = 'MAINTENANCE';
    else if (st === 'ONLINE') updatePayload.status = 'ONLINE';
    else updatePayload.status = 'OFFLINE';
  }

  const response = await api.put(`/devices/${numericId}`, updatePayload);
  return {
    ...response,
    data: toFrontendDevice(response.data),
  };
};

export const assignDevice = async (deviceId, animalId, animalName) => {
  if (useMockData()) {
    demoDevices = demoDevices.map((d) =>
      String(d.id) === String(deviceId)
        ? { ...d, assignedAnimalId: animalId, assignedAnimalName: animalName }
        : d,
    );
    return { data: demoDevices.find((d) => String(d.id) === String(deviceId)) };
  }

  const devId = Number(String(deviceId).replace(/\D/g, '')) || deviceId;
  const anmId = Number(String(animalId).replace(/\D/g, '')) || animalId;

  const response = await api.patch(`/devices/${devId}/assign/${anmId}`);
  return {
    ...response,
    data: toFrontendDevice(response.data),
  };
};

export const unassignDevice = async (deviceId) => {
  if (useMockData()) {
    demoDevices = demoDevices.map((d) =>
      String(d.id) === String(deviceId)
        ? { ...d, assignedAnimalId: null, assignedAnimalName: null }
        : d,
    );
    return { data: demoDevices.find((d) => String(d.id) === String(deviceId)) };
  }

  const devId = Number(String(deviceId).replace(/\D/g, '')) || deviceId;
  const response = await api.patch(`/devices/${devId}/unassign`);
  return {
    ...response,
    data: toFrontendDevice(response.data),
  };
};

export const resetDemoDevices = () => {
  demoDevices = [...mockDevices];
};
