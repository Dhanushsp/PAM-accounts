import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const KEYS = {
  customers: 'offline_customers',
  products: 'offline_products',
  expenses: 'offline_expenses',
  pending: 'offline_pending_actions',
  lastSync: 'offline_last_sync',
};

// Generic helpers
export async function saveData(key: string, data: any) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export async function addPendingAction(action: any) {
  const queue = (await getData<any[]>(KEYS.pending)) || [];
  queue.push(action);
  await saveData(KEYS.pending, queue);
}

export async function getPendingActions() {
  return (await getData<any[]>(KEYS.pending)) || [];
}

export async function clearPendingActions() {
  await saveData(KEYS.pending, []);
}

export async function setLastSync(date: Date) {
  await saveData(KEYS.lastSync, date.toISOString());
}

export async function getLastSync(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(KEYS.lastSync);
  return raw ? new Date(raw) : null;
}

export { KEYS }; 