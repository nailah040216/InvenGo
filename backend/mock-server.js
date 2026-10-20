require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET belum diatur di file .env');
}

// Akun demo untuk pengujian lokal
const demoUser = {
  id: 1,
  email: 'mahasiswa@example.com',
  password: 'password123',
};

// Penyimpanan refresh token untuk simulasi lokal
// Token yang sudah dicabut tidak boleh digunakan lagi.
const activeRefreshTokens = new Set();

function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function createRefreshToken(user) {
  const token = crypto.randomBytes(40).toString('hex');

  activeRefreshTokens.add(token);

  return token;
}

// Middleware untuk memeriksa access token
function authenticateToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Access token diperlukan',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.type !== 'access') {
      return res.status(401).json({
        message: 'Jenis token tidak valid',
      });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      message: 'Access token tidak valid atau kedaluwarsa',
    });
  }
}

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (
    email !== demoUser.email ||
    password !== demoUser.password
  ) {
    return res.status(401).json({
      message: 'Email atau password salah',
    });
  }

  const accessToken = createAccessToken(demoUser);
  const refreshToken = createRefreshToken(demoUser);

  return res.json({
    message: 'Login berhasil',
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 900,
  });
});

// REFRESH ACCESS TOKEN
app.post('/auth/refresh', (req, res) => {
  const { refresh_token } = req.body;

  if (
    !refresh_token ||
    !activeRefreshTokens.has(refresh_token)
  ) {
    return res.status(401).json({
      message: 'Refresh token tidak valid atau sudah dicabut',
    });
  }

  // Refresh token lama dicabut dan diganti token baru
  activeRefreshTokens.delete(refresh_token);

  const accessToken = createAccessToken(demoUser);
  const newRefreshToken = createRefreshToken(demoUser);

  return res.json({
    message: 'Token berhasil diperbarui',
    access_token: accessToken,
    refresh_token: newRefreshToken,
    token_type: 'Bearer',
    expires_in: 900,
  });
});

// MENU: memerlukan access token
app.get('/programs', authenticateToken, (req, res) => {
  return res.json({
    message: 'Berhasil mengakses menu',
    user: req.user.sub,
    data: [
      { id: 1, name: 'Daftar Barang' },
      { id: 2, name: 'Stok Barang' },
    ],
  });
});

// LOGOUT: mencabut refresh token dan mengakhiri sesi
app.post('/logout', authenticateToken, (req, res) => {
  const { refresh_token } = req.body;

  if (refresh_token) {
    activeRefreshTokens.delete(refresh_token);
  }

  return res.json({
    message: 'Logout berhasil',
    note: 'Refresh token telah dicabut jika dikirim.',
  });
});

app.listen(PORT, () => {
  console.log(`API berjalan di http://localhost:${PORT}`);
});