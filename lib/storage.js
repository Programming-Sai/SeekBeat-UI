// lib/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Simple wrapper helpers for AsyncStorage with JSON encode/decode
 */

export async function storageGet(key, defaultValue = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("storageGet error", key, err);
    return defaultValue;
  }
}

export async function storageSet(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn("storageSet error", key, err);
    return false;
  }
}

export async function storageRemove(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn("storageRemove error", key, err);
    return false;
  }
}
