module.exports = function (req, res, next) {
  // Bu middleware 'auth' middleware'dan keyin ishlashi kerak,
  // shuning uchun 'req.user' mavjud deb hisoblaymiz.
  if (req.user && req.user.role === "admin") {
    next(); // Agar foydalanuvchi admin bo'lsa, keyingi qadamga o'tkazamiz
  } else {
    res
      .status(403) // 403 Forbidden - Ruxsat taqiqlangan
      .json({ msg: "Kirish huquqi yo'q. Faqat administratorlar uchun." });
  }
};
