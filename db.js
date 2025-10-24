// db.js
const { Pool } = require("pg");
require("dotenv").config();

// .env faylidan olingan ma'lumotlar asosida yangi connection pool yaratamiz.
// Pool har bir so'rov uchun yangi ulanish yaratish o'rniga,
// mavjud ulanishlardan qayta foydalanish imkonini beradi, bu ancha samarali.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Production muhitida (masalan, Heroku, Render) SSL ulanishi talab qilinadi.
  // Bu qator NODE_ENV o'zgaruvchisi 'production' bo'lganda SSL'ni avtomatik yoqadi.
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Boshqa fayllarda so'rov yuborish uchun qulay bo'lishi uchun query funksiyasini eksport qilamiz.
module.exports = {
  query: (text, params) => pool.query(text, params),
  // Tranzaksiyalar uchun pool'dan alohida klient olish funksiyasi
  getClient: () => pool.connect(),
};
