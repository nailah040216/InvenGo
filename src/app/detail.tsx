import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DetailScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Ionicons name="cube-outline" size={48} color="#4F46E5" />

        <Text style={styles.title}>Tentang InvenGo</Text>

        <Text style={styles.description}>
          InvenGo adalah aplikasi manajemen inventaris untuk membantu
          pencatatan, pencarian, dan pemantauan barang.
        </Text>

        <Text style={styles.subtitle}>Implementasi Navigasi Expo Router</Text>

        <Text style={styles.description}>
          Halaman ini dibuka menggunakan router.push() dan tombol kembali
          menggunakan router.back().
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3730A3",
    padding: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 8,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    marginTop: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#3730A3",
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
  },
});
