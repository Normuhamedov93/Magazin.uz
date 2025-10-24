// app.js

// .env faylidagi o'zgaruvchilarni yuklash
require("dotenv").config();

const express = require("express");

// Ma'lumotlar bazasi bilan ishlash modulini import qilamiz
// const db = require("./db"); // Endi bu faylda to'g'ridan-to'g'ri kerak emas
const mangaRoutes = require("./routes/mangas");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const genreRoutes = require("./routes/genres");
const authorRoutes = require("./routes/authors");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

// JSON so'rovlarini qabul qilish uchun
app.use(express.json());

// CORS middleware'ni ulash (barcha so'rovlarga ruxsat beradi)
// Production muhiti uchun xavfsizlik sozlamalari
const allowedOrigins = [
  "http://localhost:5173", // Frontend'ni lokal test qilish uchun
  "https://your-frontend-domain.com", // Saytingizning haqiqiy domeni
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS tomonidan ruxsat etilmagan"));
    }
  },
};

app.use(cors(corsOptions));

// Asosiy (root) route
app.get("/", (req, res) => {
  res.send("Manga do`koni API serveriga xush kelibsiz!");
});

// Manga bilan bog'liq barcha so'rovlarni mangaRoutes'ga yo'naltiramiz
app.use("/api/mangas", mangaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/genres", genreRoutes);
app.use("/api/authors", authorRoutes);

// Markazlashgan xatoliklarni qayta ishlash middleware'i
// Barcha route'lardan keyin eng oxirida turishi kerak
app.use((err, req, res, next) => {
  console.error(err.stack); // Xatolikni server konsoliga chiqarish
  res.status(500).json({
    error: "Serverda kutilmagan ichki xatolik yuz berdi.",
    // Ishlab chiqish (development) muhitida xatolik haqida ko'proq ma'lumot berish mumkin
    // message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} manzilida ishga tushdi`);
});
