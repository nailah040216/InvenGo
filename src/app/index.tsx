import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORAGE_KEYS = {
  USER_EMAIL: "@invengo_user_email",
  USER_TOKEN: "@invengo_user_token",
  IS_LOGGED_IN: "@invengo_is_logged_in",
  THEME_MODE: "@invengo_theme_mode",
};

interface InventoryItem {
  id: string;
  sku: string;
  nama: string;
  kategori: string;
  stok: number;
}

interface DashboardStats {
  totalItems: number;
  borrowedItems: number;
  damagedItems: number;
}

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("home"); // Tab: 'home', 'items', 'history', 'settings', 'tracking'
  const [userEmail, setUserEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // State Pencarian, Data API & Loading
  const [searchQuery, setSearchQuery] = useState("");
  const [barangList, setBarangList] = useState<InventoryItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true);
  const [statsData, setStatsData] = useState<DashboardStats>({
    totalItems: 0,
    borrowedItems: 86,
    damagedItems: 12,
  });

  // State Modal Tambah Barang (+)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [namaBarangInput, setNamaBarangInput] = useState("");
  const [skuInput, setSkuInput] = useState("");
  const [kategoriInput, setKategoriInput] = useState("");
  const [stokInput, setStokInput] = useState("");

  // State Modal Scanner QR
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const API_URL = "https://api.presidentku.id/programs";

  useEffect(() => {
    let isMounted = true;
    const checkAuthAndTheme = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);

        if (savedTheme === "dark") setIsDarkMode(true);

        if (loggedIn === "true") {
          if (isMounted) {
            setIsLoggedIn(true);
            if (savedEmail) setUserEmail(savedEmail);
          }
        } else {
          if (isMounted) setIsLoggedIn(false);
          router.replace("/login");
        }
      } catch (error) {
        if (isMounted) setIsLoggedIn(false);
        router.replace("/login");
      }
    };

    checkAuthAndTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchApiData = async () => {
    try {
      setIsLoadingApi(true);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        const json = await response.json();
        const mappedItems: InventoryItem[] = json.map((item: any, index: number) => ({
          id: String(item.id || index + 1),
          sku: `SKU-${1000 + (item.id || index + 1)}`,
          nama: item.title ? item.title.substring(0, 30) : "Aset Inventaris",
          kategori: index % 2 === 0 ? "Elektronik" : "Fasilitas",
          stok: ((index * 7) % 25) + 1,
        }));

        setBarangList(mappedItems);
        setStatsData({
          totalItems: mappedItems.reduce((acc, curr) => acc + curr.stok, 1000),
          borrowedItems: 86,
          damagedItems: 12,
        });
      } else {
        useMockFallback();
      }
    } catch (error) {
      useMockFallback();
    } finally {
      setIsLoadingApi(false);
    }
  };

  const useMockFallback = () => {
    const fallbackData = [
      { id: "1", sku: "SKU-1001", nama: "Laptop Asus ROG", kategori: "Elektronik", stok: 5 },
      { id: "2", sku: "SKU-1002", nama: "Proyektor Epson", kategori: "Elektronik", stok: 3 },
      { id: "3", sku: "SKU-1003", nama: "Kabel HDMI 10m", kategori: "Aksesori", stok: 12 },
      { id: "4", sku: "SKU-1004", nama: "Kursi Kerja Ergonomis", kategori: "Fasilitas", stok: 8 },
    ];
    setBarangList(fallbackData);
    setStatsData({ totalItems: 1400, borrowedItems: 86, damagedItems: 12 });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApiData();
    }
  }, [isLoggedIn]);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode ? "dark" : "light");
  };

  const processLogout = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "false");
      setIsLoggedIn(false);
      router.replace("/login");
    } catch (error) {
      console.error("Gagal Logout", error);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari InvenGo?");
      if (confirmLogout) processLogout();
    } else {
      Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
        { text: "Batal", style: "cancel" },
        { text: "Keluar", style: "destructive", onPress: processLogout },
      ]);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        const msg = "Izin kamera diperlukan untuk menggunakan fitur Scanner QR.";
        Platform.OS === "web" ? alert(msg) : Alert.alert("Izin Kamera Ditolak", msg);
        return;
      }
    }
    setScanned(false);
    setIsScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsScannerVisible(false);

    setSearchQuery(data);

    const msg = `Hasil Scan QR: "${data}".\nMenampilkan barang terkait di kolom pencarian.`;
    Platform.OS === "web" ? alert(msg) : Alert.alert("QR Berhasil Pemindaian", msg);
  };

  const handleSimpanBarang = () => {
    if (!namaBarangInput.trim() || !skuInput.trim() || !stokInput.trim()) {
      const msg = "Harap isi Nama Barang, SKU, dan Stok!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Peringatan", msg);
      return;
    }

    const newItem: InventoryItem = {
      id: String(Date.now()),
      sku: skuInput.toUpperCase(),
      nama: namaBarangInput,
      kategori: kategoriInput || "Umum",
      stok: parseInt(stokInput, 10) || 0,
    };

    setBarangList([newItem, ...barangList]);
    setIsModalVisible(false);

    setNamaBarangInput("");
    setSkuInput("");
    setKategoriInput("");
    setStokInput("");

    const successMsg = "Barang berhasil ditambahkan!";
    Platform.OS === "web" ? alert(successMsg) : Alert.alert("Sukses", successMsg);
  };

  const filteredBarang = barangList.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoggedIn === null) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: "#0F172A" }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isLoggedIn) return null;

  const theme = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    headerBg: isDarkMode ? "#1E293B" : "#3730A3",
    cardBg: isDarkMode ? "#1E293B" : "#FFFFFF",
    textPrimary: isDarkMode ? "#F8FAFC" : "#0F172A",
    textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
    navBg: isDarkMode ? "#1E293B" : "#FFFFFF",
    inputBg: isDarkMode ? "#0F172A" : "#FFFFFF",
  };

  const stats = [
    {
      id: "1",
      title: "Total Barang",
      value: isLoadingApi ? "..." : statsData.totalItems.toLocaleString("id-ID"),
      unit: "Item",
      icon: "cube-outline",
      color: "#4F46E5",
      bgColor: isDarkMode ? "#312E81" : "#EEF2FF",
      trend: "+12 item baru",
    },
    {
      id: "2",
      title: "Dipinjam",
      value: String(statsData.borrowedItems),
      unit: "Aktif",
      icon: "sync-outline",
      color: "#F59E0B",
      bgColor: isDarkMode ? "#78350F" : "#FEF3C7",
      trend: "6 kembali hari ini",
    },
    {
      id: "3",
      title: "Rusak / Hilang",
      value: String(statsData.damagedItems),
      unit: "Kasus",
      icon: "alert-circle-outline",
      color: "#EF4444",
      bgColor: isDarkMode ? "#7F1D1D" : "#FEE2E2",
      trend: "2 pending audit",
    },
  ];

  const mainMenus = [
    {
      id: "daftar-barang",
      title: "Daftar Barang",
      subtitle: "Katalog & Stok Fisik",
      description: "Pantau ketersediaan barang, tambah aset baru, spesifikasi, dan manajemen kategori.",
      iconName: "archive-outline",
      tag: "Katalog",
      accentColor: "#4F46E5",
      badgeBg: isDarkMode ? "#312E81" : "#EEF2FF",
      tabKey: "items",
    },
    {
      id: "transaksi-peminjaman",
      title: "Transaksi Peminjaman",
      subtitle: "Sirkulasi & Peminjaman",
      description: "Catat formulir peminjaman, persetujuan staf, riwayat mutasi, dan tenggat pengembalian.",
      iconName: "swap-horizontal-outline",
      tag: "Sirkulasi",
      accentColor: "#0EA5E9",
      badgeBg: isDarkMode ? "#075985" : "#E0F2FE",
      tabKey: "history",
    },
    {
      id: "pelacakan-laporan",
      title: "Pelacakan & Laporan",
      subtitle: "Audit & Analitik",
      description: "Lacak posisi aset via barcode/QR, ringkasan stok opname bulanan, dan ekspor laporan.",
      iconName: "analytics-outline",
      tag: "Analitik",
      accentColor: "#10B981",
      badgeBg: isDarkMode ? "#065F46" : "#D1FAE5",
      tabKey: "tracking",
    },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.headerBg }]}>
      <ExpoStatusBar style="light" />

      {/* Header Utama */}
      <View style={[styles.headerBackground, { backgroundColor: theme.headerBg, paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topNavbar}>
          <View style={styles.brandRow}>
            <View style={styles.headerLogoContainer}>
              <MaterialCommunityIcons name="cube-scan" size={26} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>InvenGo</Text>
              <Text style={styles.brandTagline}>{userEmail || "Inventory Master System"}</Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme} activeOpacity={0.7}>
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={20} color="#FFD700" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileButton} onPress={handleLogout} activeOpacity={0.7}>
              <Feather name="log-out" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>Kelola Aset Lebih Cepat & Akurat 📦</Text>
          <Text style={styles.heroDescription}>
            Sistem terpadu manajemen inventaris untuk memonitor siklus aset, peminjaman, serta pelacakan kondisi secara real-time.
          </Text>

          <View style={styles.quickBar}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Cari kode SKU, nama barang..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner} activeOpacity={0.7}>
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Konten Utama Berdasarkan Tab */}
      <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Tampilan Hasil Pencarian */}
        {searchQuery.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 12 }]}>
              Hasil Pencarian ({filteredBarang.length})
            </Text>

            {filteredBarang.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                <Text style={{ color: theme.textSecondary }}>Barang atau SKU tidak ditemukan.</Text>
              </View>
            ) : (
              filteredBarang.map((item) => (
                <View key={item.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{item.nama}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {item.sku} | {item.kategori}
                    </Text>
                  </View>
                  <Text style={{ color: "#4F46E5", fontWeight: "bold" }}>Stok: {item.stok}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* TAB 1: BERANDA */}
        {activeTab === "home" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Ringkasan Inventaris</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Data Ringkasan System InvenGo</Text>
            </View>

            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <View key={item.id} style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.statIconWrapper, { backgroundColor: item.bgColor }]}>
                      <Ionicons name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <Text style={[styles.statUnit, { color: item.color, backgroundColor: item.bgColor }]}>{item.unit}</Text>
                  </View>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{item.value}</Text>
                  <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{item.title}</Text>
                  <View style={[styles.statTrendRow, { borderTopColor: theme.borderColor }]}>
                    <Feather name="info" size={11} color={theme.textSecondary} />
                    <Text style={[styles.statTrendText, { color: theme.textSecondary }]} numberOfLines={1}>{item.trend}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Menu Utama</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Navigasi fungsional InvenGo</Text>
            </View>

            <View style={styles.menuContainer}>
              {mainMenus.map((menu) => (
                <TouchableOpacity key={menu.id} style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} onPress={() => setActiveTab(menu.tabKey)} activeOpacity={0.7}>
                  <View style={[styles.menuIconContainer, { backgroundColor: menu.badgeBg }]}>
                    <Ionicons name={menu.iconName as any} size={28} color={menu.accentColor} />
                  </View>

                  <View style={styles.menuContent}>
                    <View style={styles.menuTitleRow}>
                      <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>{menu.title}</Text>
                      <View style={[styles.tagBadge, { backgroundColor: menu.badgeBg }]}>
                        <Text style={[styles.tagText, { color: menu.accentColor }]}>{menu.tag}</Text>
                      </View>
                    </View>
                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{menu.subtitle}</Text>
                    <Text style={[styles.menuDescription, { color: theme.textSecondary }]}>{menu.description}</Text>
                  </View>

                  <View style={styles.menuChevron}>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: BARANG */}
        {activeTab === "items" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Katalog Data Barang</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Total {barangList.length} Barang Terdaftar</Text>
            </View>

            {barangList.map((item) => (
              <View key={item.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{item.nama}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    SKU: {item.sku} | Kategori: {item.kategori}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#4F46E5", fontWeight: "bold" }}>Stok: {item.stok}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: RIWAYAT */}
        {activeTab === "history" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Riwayat Aktivitas & Peminjaman</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Log peminjaman dan mutasi aset</Text>
            </View>

            {[
              { id: "h1", user: "Rian", item: "Laptop Asus ROG", date: "Hari ini, 10:30", status: "Dipinjam", color: "#F59E0B" },
              { id: "h2", user: "Siti", item: "Proyektor Epson", date: "Kemarin, 14:15", status: "Dikembalikan", color: "#10B981" },
              { id: "h3", user: "Budi", item: "Kabel HDMI 10m", date: "20 Okt 2026", status: "Dikembalikan", color: "#10B981" },
            ].map((log) => (
              <View key={log.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]}>
                <Ionicons name="time-outline" size={24} color={theme.textSecondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{log.item}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Peminjam: {log.user} ({log.date})</Text>
                </View>
                <Text style={{ color: log.color, fontWeight: "bold", fontSize: 12 }}>{log.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: PENGATURAN */}
        {activeTab === "settings" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pengaturan Sistem</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Kelola akun dan preferensi aplikasi</Text>
            </View>

            <TouchableOpacity style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]} onPress={toggleTheme}>
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={theme.textPrimary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>Mode Tampilan</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{isDarkMode ? "Gelap (Dark)" : "Terang (Light)"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]} onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#EF4444" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchCardTitle, { color: "#EF4444" }]}>Keluar dari Akun</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{userEmail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 5: PELACAKAN & LAPORAN */}
        {activeTab === "tracking" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pelacakan Posisi & Audit Aset</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Monitoring posisi fisik barang secara real-time</Text>
            </View>

            {[
              { id: "t1", sku: "SKU-1001", nama: "Laptop Asus ROG", lokasi: "Ruang IT - Lantai 2", penanggungJawab: "Ahmad", status: "Terverifikasi" },
              { id: "t2", sku: "SKU-1002", nama: "Proyektor Epson", lokasi: "Ruang Rapat Utama", penanggungJawab: "Budi", status: "Perlu Audit" },
              { id: "t3", sku: "SKU-1003", nama: "Kabel HDMI 10m", lokasi: "Gudang A - Rak 3", penanggungJawab: "Siti", status: "Terverifikasi" },
            ].map((track) => (
              <View key={track.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 12 }]}>
                <Ionicons name="location-outline" size={24} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{track.nama}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {track.sku} | 📍 {track.lokasi}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                    PJ: {track.penanggungJawab}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: track.status === "Terverifikasi" ? "#D1FAE5" : "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                  onPress={() => {
                    const msg = `Laporan Aset: ${track.nama}\nLokasi: ${track.lokasi}\nStatus: ${track.status}`;
                    Platform.OS === "web" ? alert(msg) : Alert.alert("Detail Pelacakan", msg);
                  }}
                >
                  <Text style={{ color: track.status === "Terverifikasi" ? "#047857" : "#B45309", fontSize: 11, fontWeight: "bold" }}>
                    {track.status}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Scanner QR Kamera */}
      <Modal visible={isScannerVisible} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstructions}>Arahkan kamera ke Kode QR atau Barcode Barang</Text>

            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setIsScannerVisible(false)}>
              <Text style={styles.closeScannerText}>Tutup Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Barang (+) */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Tambah Barang Baru</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Nama Barang"
              placeholderTextColor={theme.textSecondary}
              value={namaBarangInput}
              onChangeText={setNamaBarangInput}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Kode SKU (contoh: SKU-2001)"
              placeholderTextColor={theme.textSecondary}
              value={skuInput}
              onChangeText={setSkuInput}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Kategori"
              placeholderTextColor={theme.textSecondary}
              value={kategoriInput}
              onChangeText={setKategoriInput}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Jumlah Stok"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={stokInput}
              onChangeText={setStokInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={{ color: theme.textSecondary }}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSimpanBarang}>
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.borderColor, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("home")} activeOpacity={0.7}>
          <Ionicons name={activeTab === "home" ? "home" : "home-outline"} size={22} color={activeTab === "home" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navLabel, { color: activeTab === "home" ? "#4F46E5" : theme.textSecondary }]}>Beranda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("items")} activeOpacity={0.7}>
          <Ionicons name={activeTab === "items" ? "cube" : "cube-outline"} size={22} color={activeTab === "items" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navLabel, { color: activeTab === "items" ? "#4F46E5" : theme.textSecondary }]}>Barang</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerFab} onPress={() => setIsModalVisible(true)} activeOpacity={0.7}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("history")} activeOpacity={0.7}>
          <Ionicons name={activeTab === "history" ? "time" : "time-outline"} size={22} color={activeTab === "history" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navLabel, { color: activeTab === "history" ? "#4F46E5" : theme.textSecondary }]}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("settings")} activeOpacity={0.7}>
          <Ionicons name={activeTab === "settings" ? "settings" : "settings-outline"} size={22} color={activeTab === "settings" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navLabel, { color: activeTab === "settings" ? "#4F46E5" : theme.textSecondary }]}>Pengaturan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: "#3730A3", justifyContent: "center", alignItems: "center" },
  safeArea: { flex: 1 },
  headerBackground: { paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topNavbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, zIndex: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  brandTagline: { fontSize: 11, color: "#C7D2FE" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8, zIndex: 20 },
  iconButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.15)", justifyContent: "center", alignItems: "center", cursor: "pointer" as any },
  profileButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", cursor: "pointer" as any },
  heroContent: { marginTop: 2 },
  heroGreeting: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  heroDescription: { fontSize: 12, color: "#E0E7FF", lineHeight: 18, marginBottom: 12 },
  quickBar: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchInputContainer: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, height: 36 },
  scanButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", cursor: "pointer" as any },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { fontSize: 11, marginTop: 2 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1 },
  statTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statIconWrapper: { width: 34, height: 34, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  statUnit: { fontSize: 10, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statTitle: { fontSize: 11, fontWeight: "600", marginTop: 2, marginBottom: 6 },
  statTrendRow: { flexDirection: "row", alignItems: "center", gap: 4, borderTopWidth: 1, paddingTop: 4 },
  statTrendText: { fontSize: 10, flex: 1 },
  menuContainer: { gap: 10 },
  menuCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, borderWidth: 1, cursor: "pointer" as any },
  menuIconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  menuTitle: { fontSize: 14, fontWeight: "700" },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: "700" },
  menuSubtitle: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  menuDescription: { fontSize: 11, lineHeight: 15 },
  menuChevron: { marginLeft: 6 },
  searchCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  searchCardTitle: { fontSize: 14, fontWeight: "600" },
  emptyBox: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  bottomNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingTop: 8, borderTopWidth: 1 },
  navItem: { alignItems: "center", justifyContent: "center", flex: 1, cursor: "pointer" as any },
  navLabel: { fontSize: 10, marginTop: 2, fontWeight: "500" },
  centerFab: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", marginTop: -24, borderWidth: 3, borderColor: "#FFFFFF", cursor: "pointer" as any },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 400, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  saveBtn: { backgroundColor: "#4F46E5", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  scannerContainer: { flex: 1, backgroundColor: "#000000" },
  scannerOverlay: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  scanFrame: { width: 240, height: 240, borderWidth: 2, borderColor: "#4F46E5", borderRadius: 16, backgroundColor: "transparent" },
  scanInstructions: { color: "#FFFFFF", fontSize: 13, marginTop: 20, textAlign: "center" },
  closeScannerBtn: { marginTop: 30, backgroundColor: "#EF4444", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  closeScannerText: { color: "#FFFFFF", fontWeight: "bold" },
});