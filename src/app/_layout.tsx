import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      {/* Mendaftarkan rute todo dengan header bawaan & tombol kembali otomatis */}
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
