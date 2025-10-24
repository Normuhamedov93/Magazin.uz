const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const auth = require("../middleware/auth");

// Tizimga kirgan foydalanuvchi ma'lumotlarini olish
// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  try {
    // 'auth' middleware'i token'dan user.id'ni olib, req.user'ga joylashtirgan.
    // Parol heshini qaytarmaslik uchun kerakli ustunlarni aniq ko'rsatamiz.
    const user = await db.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server xatoligi");
  }
});

// Foydalanuvchini ro'yxatdan o'tkazish
// POST /api/users/register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Oddiy validatsiya
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Iltimos, barcha maydonlarni to'ldiring." });
  }

  try {
    // Foydalanuvchi mavjudligini tekshirish
    const userExists = await db.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res
        .status(409) // 409 Conflict
        .json({ error: "Bu email yoki username allaqachon mavjud." });
    }

    // Parolni heshlash
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Yangi foydalanuvchini bazaga saqlash
    const newUser = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, password_hash]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    // Kutilmagan xatoliklarni markaziy error handler'ga yuborish
    next(err);
  }
});

// Foydalanuvchini tizimga kiritish (Login)
// POST /api/users/login
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  // Validatsiya
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Iltimos, email va parolni kiriting." });
  }

  try {
    // Foydalanuvchini email bo'yicha topish
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Email yoki parol noto'g'ri." });
    }

    // Parolni solishtirish
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Email yoki parol noto'g'ri." });
    }

    // JWT Token yaratish
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role, // Foydalanuvchi rolini payload'ga qo'shamiz
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" }, // Token amal qilish muddatini uzaytirish mumkin
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    next(err); // Kutilmagan xatoliklarni markaziy error handler'ga yuborish
  }
});

module.exports = router;
