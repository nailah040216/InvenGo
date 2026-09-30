import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// --- LOCAL STORAGE (AsyncStorage) ---
export const saveLocalStorage = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error("Gagal menyimpan ke Local Storage", e);
  }
};

export const getLocalStorage = async (key: string) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error("Gagal mengambil dari Local Storage", e);
    return null;
  }
};

export const removeLocalStorage = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error("Gagal menghapus dari Local Storage", e);
  }
};

// --- SECURE STORAGE (Expo SecureStore) ---
export const saveSecureStorage = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.error("Gagal menyimpan ke Secure Storage", e);
  }
};

export const getSecureStorage = async (key: string) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.error("Gagal mengambil dari Secure Storage", e);
    return null;
  }
};

export const removeSecureStorage = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.error("Gagal menghapus dari Secure Storage", e);
  }
};
