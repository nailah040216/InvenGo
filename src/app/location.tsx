import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Circle, Marker, UrlTile } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Titik Pusat Geofence (Area Kampus UMM)
const GEOFENCE_CENTER = {
  latitude: -7.9211,
  longitude: 112.5993,
  radius: 500, // dalam meter
  name: "Area Kampus UMM",
};

// Fungsi menghitung jarak (Haversine formula dalam meter)
function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [address, setAddress] = useState<string>("Belum ada data alamat");
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  // State baru untuk Pencarian Alamat (Forward Geocoding)
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchedLocation, setSearchedLocation] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  // Fungsi memproses koordinat: Reverse Geocoding + Cek Geofence
  const processLocationData = async (
    latitude: number,
    longitude: number,
    accuracy: number | null
  ) => {
    setCoords({ latitude, longitude, accuracy });

    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      800
    );

    // Reverse Geocoding (Koordinat -> Alamat)
    try {
      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (geocodeResult.length > 0) {
        const place = geocodeResult[0];
        const formattedAddress = [
          place.street,
          place.district,
          place.city || place.subregion,
          place.region,
          place.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
        setAddress(formattedAddress || "Alamat tidak ditemukan");
      }
    } catch (err) {
      console.log("Reverse geocoding error:", err);
      setAddress("Gagal memuat alamat (cek koneksi internet)");
    }

    // Geofencing Check
    const distance = getDistanceInMeters(
      latitude,
      longitude,
      GEOFENCE_CENTER.latitude,
      GEOFENCE_CENTER.longitude
    );
    const inside = distance <= GEOFENCE_CENTER.radius;

    if (inside && !isInsideGeofence) {
      Alert.alert(
        "📍 Geofence Enter Event",
        `Anda masuk ${GEOFENCE_CENTER.name}! Selamat datang di area kampus.`
      );
    } else if (!inside && isInsideGeofence) {
      Alert.alert(
        "🚶 Geofence Exit Event",
        `Anda keluar dari ${GEOFENCE_CENTER.name}.`
      );
    }
    setIsInsideGeofence(inside);
  };

  // FITUR BARU: Pencarian Alamat (Forward Geocoding: Nama Alamat -> Koordinat)
  const handleSearchAddress = async () => {
    const query = searchAddress.trim();
    if (!query) {
      Alert.alert("Pencarian Kosong", "Masukkan nama tempat atau alamat tujuan.");
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Ditolak", "Izin lokasi diperlukan untuk fitur geocoding.");
        return;
      }

      const results = await Location.geocodeAsync(query);
      if (results.length === 0) {
        Alert.alert(
          "Lokasi Tidak Ditemukan",
          `Tidak dapat menemukan koordinat untuk "${query}". Coba kata kunci yang lebih spesifik.`
        );
        return;
      }

      const target = results[0];
      setSearchedLocation({
        latitude: target.latitude,
        longitude: target.longitude,
        label: query,
      });

      // Arahkan kamera peta ke lokasi hasil pencarian
      mapRef.current?.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        800
      );
    } catch (error) {
      console.error("Forward geocoding error:", error);
      Alert.alert(
        "Gagal Mencari Lokasi",
        "Terjadi kesalahan saat mengubah alamat menjadi koordinat. Pastikan internet aktif."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Ambil Lokasi Saat Ini
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Ditolak",
          "Aplikasi membutuhkan izin lokasi untuk menampilkan koordinat dan peta."
        );
        setIsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await processLocationData(
        loc.coords.latitude,
        loc.coords.longitude,
        loc.coords.accuracy
      );
    } catch (error) {
      Alert.alert("Error GPS", "Gagal mengambil lokasi perangkat.");
    } finally {
      setIsLoading(false);
    }
  };

  // Live Tracking (Battery Optimization)
  const toggleLiveTracking = async () => {
    if (isTracking) {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
      setIsTracking(false);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Ditolak", "Izin lokasi diperlukan untuk tracking.");
      return;
    }

    setIsTracking(true);
    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        processLocationData(
          loc.coords.latitude,
          loc.coords.longitude,
          loc.coords.accuracy
        );
      }
    );
  };

  // Simulasi Masuk Area Kampus
  const handleSimulateEnterCampus = async () => {
    await processLocationData(
      GEOFENCE_CENTER.latitude,
      GEOFENCE_CENTER.longitude,
      5.0
    );
  };

  // Hitung jarak ke lokasi yang dicari (jika keduanya ada)
  const distanceToSearched =
    coords && searchedLocation
      ? getDistanceInMeters(
          coords.latitude,
          coords.longitude,
          searchedLocation.latitude,
          searchedLocation.longitude
        )
      : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Location-Based Services</Text>
          <Text style={styles.headerSubtitle}>
            Week 10: GPS, Maps, Geocoding & Geofencing
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* FITUR BARU: Search Bar Alamat (Forward Geocoding) */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari alamat/tempat (cth: Alun-Alun Malang)..."
              placeholderTextColor="#94A3B8"
              value={searchAddress}
              onChangeText={setSearchAddress}
              onSubmitEditing={handleSearchAddress}
              returnKeyType="search"
            />
            {searchAddress.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchAddress("");
                  setSearchedLocation(null);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearchAddress}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Info Hasil Pencarian Forward Geocoding */}
        {searchedLocation && (
          <View style={styles.searchResultCard}>
            <Ionicons name="pin" size={20} color="#0284C7" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.searchResultTitle}>
                Tujuan: {searchedLocation.label}
              </Text>
              <Text style={styles.searchResultCoord}>
                Koordinat: {searchedLocation.latitude.toFixed(5)},{" "}
                {searchedLocation.longitude.toFixed(5)}
                {distanceToSearched !== null
                  ? ` • Jarak: ${(distanceToSearched / 1000).toFixed(2)} km`
                  : ""}
              </Text>
            </View>
          </View>
        )}

        {/* Peta Terang (CartoDB Voyager Tile) & Marker */}
        <View style={styles.mapCard}>
          <MapView
            ref={mapRef}
            style={styles.map}
            mapType="none"
            initialRegion={{
              latitude: GEOFENCE_CENTER.latitude,
              longitude: GEOFENCE_CENTER.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            {/* Tile Peta Terang & Jelas tanpa butuh API Key */}
            <UrlTile
              urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />

            {/* Lingkaran Geofence */}
            <Circle
              center={{
                latitude: GEOFENCE_CENTER.latitude,
                longitude: GEOFENCE_CENTER.longitude,
              }}
              radius={GEOFENCE_CENTER.radius}
              fillColor="rgba(79, 70, 229, 0.15)"
              strokeColor="#4F46E5"
              strokeWidth={2}
            />

            {/* Marker Pusat Geofence */}
            <Marker
              coordinate={{
                latitude: GEOFENCE_CENTER.latitude,
                longitude: GEOFENCE_CENTER.longitude,
              }}
              title={GEOFENCE_CENTER.name}
              description="Radius Geofence 500m"
              pinColor="indigo"
            />

            {/* Marker Lokasi Pengguna */}
            {coords && (
              <Marker
                coordinate={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                }}
                title="Lokasi Saya"
                description={address}
                pinColor="red"
              />
            )}

            {/* Marker Hasil Pencarian Alamat */}
            {searchedLocation && (
              <Marker
                coordinate={{
                  latitude: searchedLocation.latitude,
                  longitude: searchedLocation.longitude,
                }}
                title={searchedLocation.label}
                description="Hasil Pencarian Geocoding"
                pinColor="blue"
              />
            )}
          </MapView>
        </View>

        {/* Status Geofencing */}
        <View
          style={[
            styles.geofenceBanner,
            {
              backgroundColor: isInsideGeofence ? "#DCFCE7" : "#F1F5F9",
              borderColor: isInsideGeofence ? "#16A34A" : "#CBD5E1",
            },
          ]}
        >
          <Ionicons
            name={isInsideGeofence ? "checkmark-circle" : "navigate-circle"}
            size={24}
            color={isInsideGeofence ? "#16A34A" : "#64748B"}
          />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.geofenceTitle}>
              {isInsideGeofence
                ? `Dalam Area Geofence (${GEOFENCE_CENTER.name})`
                : "Di Luar Area Geofence"}
            </Text>
            <Text style={styles.geofenceDesc}>
              Radius pantau: {GEOFENCE_CENTER.radius} meter dari titik kampus
            </Text>
          </View>
        </View>

        {/* Detail Koordinat & Reverse Geocoding */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Detail Lokasi Perangkat</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>
              {coords ? coords.latitude.toFixed(6) : "-"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>
              {coords ? coords.longitude.toFixed(6) : "-"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Akurasi GPS</Text>
            <Text style={styles.value}>
              {coords?.accuracy ? `± ${coords.accuracy.toFixed(1)} m` : "-"}
            </Text>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>
              Alamat (Reverse Geocoding):
            </Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>

        {/* Tombol Aksi */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleGetCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="locate" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Ambil Lokasi Saat Ini</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              isTracking && {
                backgroundColor: "#FEE2E2",
                borderColor: "#EF4444",
              },
            ]}
            onPress={toggleLiveTracking}
          >
            <Ionicons
              name={isTracking ? "stop-circle-outline" : "play-circle-outline"}
              size={18}
              color={isTracking ? "#EF4444" : "#4F46E5"}
            />
            <Text
              style={[
                styles.secondaryBtnText,
                isTracking && { color: "#EF4444" },
              ]}
            >
              {isTracking ? "Stop Tracking" : "Live Tracking"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSimulateEnterCampus}
          >
            <Ionicons name="school-outline" size={18} color="#4F46E5" />
            <Text style={styles.secondaryBtnText}>Simulasi Masuk Area</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#4F46E5",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  content: { padding: 16, paddingBottom: 40 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#7DD3FC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0369A1",
  },
  searchResultCoord: {
    fontSize: 11,
    color: "#0C4A6E",
    marginTop: 2,
  },
  mapCard: {
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    backgroundColor: "#E2E8F0",
  },
  map: { width: "100%", height: "100%" },
  geofenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  geofenceTitle: { fontSize: 13, fontWeight: "bold", color: "#0F172A" },
  geofenceDesc: { fontSize: 11, color: "#475569", marginTop: 2 },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  label: { fontSize: 13, color: "#64748B" },
  value: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  addressBox: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  addressLabel: { fontSize: 11, color: "#64748B", marginBottom: 4 },
  addressText: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  secondaryRow: { flexDirection: "row", justifyContent: "space-between" },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  secondaryBtnText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
});