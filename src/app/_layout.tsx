import { useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { API_BASE_URL } from "../utils/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [pendingRouteData, setPendingRouteData] = useState<Record<string, any> | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Eksekusi navigasi hanya setelah Expo Router siap sepenuhnya
  useEffect(() => {
    if (!rootNavigationState?.key || !pendingRouteData) return;

    const data = pendingRouteData;
    setPendingRouteData(null);

    try {
      if (data.screen === "detail") {
        router.push({ pathname: "/detail", params: { id: String(data.id ?? "") } });
      } else if (data.screen === "todo") {
        router.push("/todo");
      } else if (data.screen === "explore") {
        router.push("/explore");
      } else if (data.screen === "location") {
        router.push("/location");
      }
    } catch (err) {
      console.warn("Navigasi notifikasi gagal:", err);
    }
  }, [rootNavigationState?.key, pendingRouteData]);

  useEffect(() => {
    // 1. Registrasi token ke mock-server.js
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        try {
          await fetch(`${API_BASE_URL}/api/register-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch (err) {
          console.error("Gagal kirim token ke backend:", err);
        }
      }
    });

    // 2. Polling notifikasi dari mock-server.js
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/poll`);
        const json = await res.json();
        if (json.notifications?.length > 0) {
         for (const item of json.notifications) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: item.title || "Info InvenGo",
                body: item.body || "",
                data: item.data || {},
                ...(Platform.OS === "android" ? { channelId: "invengo-alerts" } : {}),
              },
              trigger: null,
            });
          }
        }
      } catch {
        // Abaikan error jaringan sementara
      }
    }, 3000);

    // 3. Listener saat notifikasi diterima di Foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notifikasi masuk:", notification.request.content);
    });

    // 4. Listener saat notifikasi diketuk (simpan ke state agar dieksekusi aman saat router siap)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response?.notification?.request?.content?.data;
        if (data && typeof data === "object") {
          setPendingRouteData(data as Record<string, any>);
        }
      } catch (err) {
        console.warn("Gagal membaca data notifikasi:", err);
      }
    });

    return () => {
      clearInterval(pollInterval);
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="detail" />
      <Stack.Screen name="location" />
      <Stack.Screen
        name="todo"
        options={{
          headerShown: true,
          title: "Todo List Async",
          headerStyle: { backgroundColor: "#4F46E5" },
          headerTintColor: "#FFFFFF",
        }}
      />
    </Stack>
  );
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    Alert.alert("Peringatan", "Gunakan HP fisik untuk menguji Push Notification.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    Alert.alert("Izin Ditolak", "Izin notifikasi diperlukan untuk InvenGo.");
    return;
  }

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("invengo-alerts", {
        name: "InvenGo Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    } catch (e) {
      console.warn("Skip channel:", e);
    }
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    console.log("EXPO PUSH TOKEN:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.warn("Gagal ambil token asli, gunakan fallback token:", error);
    return `ExponentPushToken[ExpoGo-${Date.now()}]`;
  }
}