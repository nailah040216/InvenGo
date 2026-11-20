import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const API_STORAGE_KEYS = {
  ACCESS_TOKEN: "@invengo_user_token",
  REFRESH_TOKEN: "@invengo_refresh_token",
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001");

export const authenticatedApiFetch = async (
  path: string,
  init: RequestInit,
): Promise<Response> => {
  const accessToken = await AsyncStorage.getItem(API_STORAGE_KEYS.ACCESS_TOKEN);
  if (!accessToken) {
    throw new Error("Sesi API tidak ditemukan. Silakan login kembali.");
  }

  const request = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", "Bearer " + token);
    return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  };

  const response = await request(accessToken);
  if (response.status !== 401) return response;

  const refreshToken = await AsyncStorage.getItem(
    API_STORAGE_KEYS.REFRESH_TOKEN,
  );
  if (!refreshToken) {
    throw new Error("Sesi API kedaluwarsa. Silakan login kembali.");
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const refreshed = (await refreshResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    message?: string;
  };

  if (
    !refreshResponse.ok ||
    !refreshed.access_token ||
    !refreshed.refresh_token
  ) {
    await AsyncStorage.multiRemove([
      API_STORAGE_KEYS.ACCESS_TOKEN,
      API_STORAGE_KEYS.REFRESH_TOKEN,
    ]);
    throw new Error(
      refreshed.message || "Sesi API kedaluwarsa. Silakan login kembali.",
    );
  }

  await AsyncStorage.multiSet([
    [API_STORAGE_KEYS.ACCESS_TOKEN, refreshed.access_token],
    [API_STORAGE_KEYS.REFRESH_TOKEN, refreshed.refresh_token],
  ]);
  return request(refreshed.access_token);
};
