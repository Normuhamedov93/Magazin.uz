const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Headerni ichidan tokenni olamiz
  const authHeader = req.header("Authorization");

  // Agar header yoki token bo'lmasa
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Ruxsat yo'q, token mavjud emas." });
  }

  try {
    // "Bearer " so'zidan keyingi qismini (tokenni o'zini) ajratib olamiz
    const token = authHeader.split(" ")[1];

    // Tokenni tekshiramiz
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tekshirilgan foydalanuvchi ma'lumotlarini request obyektiga qo'shib qo'yamiz
    req.user = decoded.user;
    next(); // Keyingi middleware yoki route'ga o'tish
  } catch (err) {
    res.status(401).json({ msg: "Token yaroqsiz." });
  }
};
