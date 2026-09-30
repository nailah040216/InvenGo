import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLocalStorage, removeLocalStorage } from "../utils/storage";

const { width } = Dimensions.get("window");

export default function App() {
  const router = useRouter();

  // State diatur ke null terlebih dahulu agar aplikasi menunggu proses baca Local Storage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [userEmail, setUserEmail] = useState("");

  // Pengecekan Status Login dari Local Storage saat komponen dimuat
  useEffect(() => {
    const checkAuthStatus = async () => {
      const status = await getLocalStorage("isLoggedIn");
      const savedEmail = await getLocalStorage("userEmail");

      if (status === "true") {
        setIsLoggedIn(true);
        if (savedEmail) setUserEmail(savedEmail);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Fitur Logout
  const handleLogout = () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await removeLocalStorage("isLoggedIn");
          setIsLoggedIn(false);
        },
      },
    ]);
  };

  // 1. Tampilan Loading saat membaca Local Storage
  if (isLoggedIn === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // 2. Pengalihan Otomatis jika status login adalah false
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  // Data Statistik Ringkas
  const stats = [
    {
      id: "1",
      title: "Total Barang",
      value: "1,428",
      unit: "Item",
      icon: "cube-outline",
      color: "#4F46E5",
      bgColor: "#EEF2FF",
      trend: "+12 item baru",
    },
    {
      id: "2",
      title: "Dipinjam",
      value: "86",
      unit: "Aktif",
      icon: "sync-outline",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      trend: "6 kembali hari ini",
    },
    {
      id: "3",
      title: "Rusak / Hilang",
      value: "12",
      unit: "Kasus",
      icon: "alert-circle-outline",
      color: "#EF4444",
      bgColor: "#FEE2E2",
      trend: "2 pending audit",
    },
  ];

  // 3 Menu Utama Aplikasi
  const mainMenus = [
    {
      id: "daftar-barang",
      title: "Daftar Barang",
      subtitle: "Katalog & Stok Fisik",
      description:
        "Pantau ketersediaan barang, tambah aset baru, spesifikasi, dan manajemen kategori.",
      iconName: "archive-outline",
      tag: "Katalog",
      accentColor: "#4F46E5",
      badgeBg: "#EEF2FF",
    },
    {
      id: "transaksi-peminjaman",
      title: "Transaksi Peminjaman",
      subtitle: "Sirkulasi & Peminjaman",
      description:
        "Catat formulir peminjaman, persetujuan staf, riwayat mutasi, dan tenggat pengembalian.",
      iconName: "swap-horizontal-outline",
      tag: "Sirkulasi",
      accentColor: "#0EA5E9",
      badgeBg: "#E0F2FE",
    },
    {
      id: "pelacakan-laporan",
      title: "Pelacakan & Laporan",
      subtitle: "Audit & Analitik",
      description:
        "Lacak posisi aset via barcode/QR, ringkasan stok opname bulanan, dan ekspor laporan.",
      iconName: "analytics-outline",
      tag: "Analitik",
      accentColor: "#10B981",
      badgeBg: "#D1FAE5",
    },
  ];

  const handleMenuPress = (menuTitle: string) => {
    Alert.alert("Navigasi Menu", "Membuka halaman " + menuTitle);
  };

  const handleActionPress = (actionName: string) => {
    Alert.alert("Aksi Cepat", "Menjalankan aksi: " + actionName);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <View style={styles.headerBackground}>
        {/* Top Navbar */}
        <View style={styles.topNavbar}>
          <View style={styles.brandRow}>
            <View style={styles.headerLogoContainer}>
              <MaterialCommunityIcons
                name="cube-scan"
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text style={styles.brandName}>InvenGo</Text>
              <Text style={styles.brandTagline}>
                {userEmail ? userEmail : "Inventory Master System"}
              </Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => handleActionPress("Notifikasi")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#FFFFFF"
              />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>

            {/* Tombol Profil sekaligus berfungsi untuk Logout */}
            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>
            Kelola Aset Lebih Cepat & Akurat 📦
          </Text>
          <Text style={styles.heroDescription}>
            Sistem terpadu manajemen inventaris untuk memonitor siklus aset,
            peminjaman, serta pelacakan kondisi secara real-time.
          </Text>

          {/* Quick Search & Scan Bar */}
          <View style={styles.quickBar}>
            <TouchableOpacity
              style={styles.searchFakeInput}
              activeOpacity={0.8}
              onPress={() => handleActionPress("Pencarian Barang")}
            >
              <Ionicons name="search" size={18} color="#64748B" />
              <Text style={styles.searchPlaceholder}>
                Cari kode SKU, nama barang...
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scanButton}
              activeOpacity={0.8}
              onPress={() => handleActionPress("Scan QR/Barcode")}
            >
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Konten Utama */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Ringkasan */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ringkasan Inventaris</Text>
            <Text style={styles.sectionSubtitle}>Update data per hari ini</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleActionPress("Segarkan Data")}
          >
            <Text style={styles.linkText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <View style={styles.statTopRow}>
                <View
                  style={[
                    styles.statIconWrapper,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                </View>
                <Text
                  style={[
                    styles.statUnit,
                    { color: item.color, backgroundColor: item.bgColor },
                  ]}
                >
                  {item.unit}
                </Text>
              </View>

              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statTitle}>{item.title}</Text>

              <View style={styles.statTrendRow}>
                <Feather name="info" size={11} color="#64748B" />
                <Text style={styles.statTrendText} numberOfLines={1}>
                  {item.trend}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 2: Menu Utama */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View>
            <Text style={styles.sectionTitle}>Menu Utama</Text>
            <Text style={styles.sectionSubtitle}>
              Navigasi fungsional InvenGo
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {mainMenus.map((menu) => (
            <TouchableOpacity
              key={menu.id}
              style={styles.menuCard}
              activeOpacity={0.75}
              onPress={() => handleMenuPress(menu.title)}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: menu.badgeBg },
                ]}
              >
                <Ionicons
                  name={menu.iconName as any}
                  size={28}
                  color={menu.accentColor}
                />
              </View>

              <View style={styles.menuContent}>
                <View style={styles.menuTitleRow}>
                  <Text style={styles.menuTitle}>{menu.title}</Text>
                  <View
                    style={[styles.tagBadge, { backgroundColor: menu.badgeBg }]}
                  >
                    <Text style={[styles.tagText, { color: menu.accentColor }]}>
                      {menu.tag}
                    </Text>
                  </View>
                </View>
                <Text style={styles.menuSubtitle}>{menu.subtitle}</Text>
                <Text style={styles.menuDescription}>{menu.description}</Text>
              </View>

              <View style={styles.menuChevron}>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner Stok Opname */}
        <View style={styles.auditBanner}>
          <View style={styles.auditTextCol}>
            <View style={styles.auditHeaderRow}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={styles.auditTag}>Jadwal Audit Berkala</Text>
            </View>
            <Text style={styles.auditTitle}>Stok Opname Q3 Segera Dimulai</Text>
            <Text style={styles.auditDesc}>
              Pastikan verifikasi fisik barang telah disinkronkan sebelum
              tanggal 30 bulan ini.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.auditButton}
            activeOpacity={0.8}
            onPress={() => handleActionPress("Detail Audit")}
          >
            <Text style={styles.auditButtonText}>Lihat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={22}
            color={activeTab === "home" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "home" && styles.navLabelActive,
            ]}
          >
            Beranda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("items")}
        >
          <Ionicons
            name={activeTab === "items" ? "cube" : "cube-outline"}
            size={22}
            color={activeTab === "items" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "items" && styles.navLabelActive,
            ]}
          >
            Barang
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerFab}
          activeOpacity={0.85}
          onPress={() => handleActionPress("Tambah Barang Baru")}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name={activeTab === "history" ? "time" : "time-outline"}
            size={22}
            color={activeTab === "history" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "history" && styles.navLabelActive,
            ]}
          >
            Riwayat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("settings")}
        >
          <Ionicons
            name={activeTab === "settings" ? "settings" : "settings-outline"}
            size={22}
            color={activeTab === "settings" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "settings" && styles.navLabelActive,
            ]}
          >
            Pengaturan
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#3730A3",
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#3730A3",
  },
  headerBackground: {
    backgroundColor: "#3730A3",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topNavbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: "#C7D2FE",
    fontWeight: "500",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#3730A3",
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    marginTop: 6,
  },
  heroGreeting: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 13,
    color: "#E0E7FF",
    lineHeight: 19,
    marginBottom: 16,
  },
  quickBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchFakeInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: "#94A3B8",
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  linkText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statUnit: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  statTitle: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 8,
  },
  statTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 6,
  },
  statTrendText: {
    fontSize: 10,
    color: "#64748B",
    flex: 1,
  },
  menuContainer: {
    gap: 12,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  menuChevron: {
    marginLeft: 8,
  },
  auditBanner: {
    marginTop: 20,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auditTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  auditHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  auditTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
    textTransform: "uppercase",
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064E3B",
    marginBottom: 4,
  },
  auditDesc: {
    fontSize: 12,
    color: "#047857",
    lineHeight: 16,
  },
  auditButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  auditButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    position: "relative",
    height: 64,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  centerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -28,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});
