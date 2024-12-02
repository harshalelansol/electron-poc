import osUtils from 'os-utils';
import os from 'os';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import { ipcWebContentsSend } from './util.js';
import si from 'systeminformation'; // Add this import

const POLLING_INTERVAL = 500;

export function pollResources(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = getRamUsage();
    const storageData = getStorageData();
    const cpuTemp = await getCpuTemperature(); // Fetch CPU temperature

    ipcWebContentsSend('statistics', mainWindow.webContents, {
      cpuUsage,
      ramUsage,
      storageUsage: storageData.usage,
      cpuTemp, // Include temperature
    });
  }, POLLING_INTERVAL);
}

async function getCpuTemperature(): Promise<number> {
  try {
    const { main } = await si.cpuTemperature();
    return main ?? 0; // Return the main CPU temperature, or 0 if not available
  } catch (error) {
    console.error('Error fetching CPU temperature:', error);
    return 0;
  }
}

export function getStaticData() {
  const totalStorage = getStorageData().total;
  const cpuModel = os.cpus()[0].model;
  const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024);

  return {
    totalStorage,
    cpuModel,
    totalMemoryGB,
  };
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    osUtils.cpuUsage(resolve);
  });
}

function getRamUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageData() {
  // requires node 18
  const stats = fs.statfsSync(process.platform === 'win32' ? 'C://' : '/');
  const total = stats.bsize * stats.blocks;
  const free = stats.bsize * stats.bfree;

  return {
    total: Math.floor(total / 1_000_000_000),
    usage: 1 - free / total,
  };
}
