const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "8mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_jwt_invengo_default_2026";

const usersByEmail = new Map();
let nextUserId = 1;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString("hex"),
  };
}

const demoUser = {
  id: nextUserId++,
  email: "mahasiswa@example.com",
  ...hashPassword("password123"),
};
usersByEmail.set(demoUser.email, demoUser);

const activeRefreshTokens = new Map();
const inventoryItems = [];

// === Penyimpanan Expo Push Token & Antrean Notifikasi ===
const registeredPushTokens = new Set();
const pendingNotifications = [];

async function sendPushNotificationToExpo({ title, body, data, targetToken }) {
  const tokensToSend = targetToken
    ? [targetToken]
    : Array.from(registeredPushTokens);

  if (tokensToSend.length === 0) {
    console.log("⚠️ Belum ada Push Token terdaftar, notifikasi dilewati.");
    return null;
  }

  const notifPayload = {
    id: Date.now().toString(),
    title: title || "Info InvenGo",
    body: body || "Ada pembaruan data baru!",
    data: data || { screen: "detail", id: "101" },
  };

  pendingNotifications.push(notifPayload);

  const realTokens = tokensToSend.filter((t) => !t.includes("ExpoGo-"));
  if (realTokens.length === 0) {
    return { status: "delivered_via_expo_go_bridge", payload: notifPayload };
  }

  const messages = realTokens.map((pushToken) => ({
    to: pushToken,
    sound: "default",
    title: notifPayload.title,
    body: notifPayload.body,
    data: notifPayload.data,
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  return response.json();
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, type: "access" },
    JWT_SECRET,
    { expiresIn: "15m" },
  );
}

function createRefreshToken(user) {
  const token = crypto.randomBytes(40).toString("hex");
  activeRefreshTokens.set(token, user);
  return token;
}

function authenticateToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Access token diperlukan" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "access") {
      return res.status(401).json({ message: "Jenis token tidak valid" });
    }
    req.user = payload;
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Access token tidak valid atau kedaluwarsa" });
  }
}

// === TASK 01: Mendaftarkan Push Token dari HP ===
app.post("/api/register-token", (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Push token tidak valid" });
  }

  registeredPushTokens.add(token);
  console.log("✅ Push Token terdaftar:", token);

  return res.status(200).json({
    message: "Perangkat berhasil didaftarkan untuk notifikasi",
    token,
  });
});

// === TASK 02: Mengirim Push Notification ===
app.post("/api/send-notification", async (req, res) => {
  const { title, body, data, targetToken } = req.body;

  if (!targetToken && registeredPushTokens.size === 0) {
    return res.status(400).json({
      message:
        "Belum ada perangkat yang terdaftar. Buka aplikasi di HP terlebih dahulu.",
    });
  }

  try {
    const result = await sendPushNotificationToExpo({
      title,
      body,
      data,
      targetToken,
    });
    console.log("🚀 Notifikasi terkirim:", result);
    return res.json({
      message: "Notifikasi berhasil dikirim",
      result,
    });
  } catch (error) {
    console.error("❌ Error kirim notifikasi:", error);
    return res
      .status(500)
      .json({ message: "Gagal mengirim notifikasi", error: error.message });
  }
});

// Endpoint polling notifikasi untuk Expo Go SDK 58
app.get("/api/notifications/poll", (req, res) => {
  if (pendingNotifications.length === 0) {
    return res.json({ notifications: [] });
  }
  const items = [...pendingNotifications];
  pendingNotifications.length = 0;
  return res.json({ notifications: items });
});

// REGISTER
app.post("/register", (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Format email tidak valid" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password harus memiliki minimal 8 karakter",
    });
  }

  if (usersByEmail.has(email)) {
    return res.status(409).json({ message: "Email sudah terdaftar" });
  }

  const user = {
    id: nextUserId++,
    email,
    ...hashPassword(password),
  };
  usersByEmail.set(email, user);

  return res.status(201).json({
    message: "Registrasi berhasil",
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";
  const user = usersByEmail.get(email);

  if (!user || !password) {
    return res.status(401).json({ message: "Email atau password salah" });
  }

  const submittedHash = crypto.scryptSync(password, user.salt, 64);
  const savedHash = Buffer.from(user.hash, "hex");
  if (!crypto.timingSafeEqual(submittedHash, savedHash)) {
    return res.status(401).json({ message: "Email atau password salah" });
  }

  const publicUser = { id: user.id, email: user.email };
  const accessToken = createAccessToken(publicUser);
  const refreshToken = createRefreshToken(publicUser);

  return res.json({
    message: "Login berhasil",
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: 900,
  });
});

// REFRESH ACCESS TOKEN
app.post("/auth/refresh", (req, res) => {
  const { refresh_token } = req.body;
  const user = activeRefreshTokens.get(refresh_token);

  if (!refresh_token || !user) {
    return res.status(401).json({
      message: "Refresh token tidak valid atau sudah dicabut",
    });
  }

  activeRefreshTokens.delete(refresh_token);

  const accessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  return res.json({
    message: "Token berhasil diperbarui",
    access_token: accessToken,
    refresh_token: newRefreshToken,
    token_type: "Bearer",
    expires_in: 900,
  });
});

// INVENTORY
app.get("/inventory", authenticateToken, (req, res) => {
  const data = inventoryItems.filter((item) => item.user_id === req.user.sub);
  return res.json({ data });
});

app.post("/inventory", authenticateToken, async (req, res) => {
  const { sku, nama, kategori, stok, foto = null } = req.body;

  if (
    typeof sku !== "string" ||
    !sku.trim() ||
    typeof nama !== "string" ||
    !nama.trim() ||
    typeof kategori !== "string" ||
    !kategori.trim() ||
    !Number.isInteger(stok) ||
    stok < 0
  ) {
    return res.status(400).json({
      message: "SKU, nama, kategori, dan stok integer >= 0 wajib diisi",
    });
  }

  if (
    foto !== null &&
    (typeof foto !== "string" ||
      foto.length > 7_000_000 ||
      !/^data:image\/(?:jpeg|png|webp|heic|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        foto,
      ))
  ) {
    return res.status(400).json({
      message:
        "Foto harus berupa data URL gambar valid dengan ukuran maksimal 5 MB",
    });
  }

  const normalizedSku = sku.trim().toUpperCase();
  const duplicate = inventoryItems.some(
    (item) => item.user_id === req.user.sub && item.sku === normalizedSku,
  );
  if (duplicate) {
    return res.status(409).json({ message: "SKU sudah terdaftar" });
  }

  const item = {
    id: crypto.randomBytes(12).toString("hex"),
    user_id: req.user.sub,
    sku: normalizedSku,
    nama: nama.trim(),
    kategori: kategori.trim(),
    stok,
    foto,
  };
  inventoryItems.unshift(item);

  try {
    await sendPushNotificationToExpo({
      title: "Barang Baru Ditambahkan!",
      body: `${item.nama} (${item.sku}) - Stok: ${item.stok}`,
      data: { screen: "detail", id: item.id },
    });
  } catch (err) {
    console.warn("Notifikasi gagal terkirim:", err.message);
  }

  return res
    .status(201)
    .json({ message: "Barang berhasil ditambahkan", data: item });
});

// MENU
app.get("/programs", authenticateToken, (req, res) => {
  return res.json({
    message: "Berhasil mengakses menu",
    user: req.user.sub,
    data: [
      { id: 1, name: "Daftar Barang" },
      { id: 2, name: "Stok Barang" },
    ],
  });
});

// LOGOUT
app.post("/logout", authenticateToken, (req, res) => {
  for (const [token, user] of activeRefreshTokens) {
    if (String(user.id) === req.user.sub) {
      activeRefreshTokens.delete(token);
    }
  }

  return res.json({
    message: "Logout berhasil",
    note: "Semua refresh token untuk sesi pengguna telah dicabut.",
  });
});

app.listen(PORT, () => {
  console.log(`API berjalan di http://localhost:${PORT}`);
});
