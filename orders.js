const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth"); // Correct path
const admin = require("../middleware/admin"); // Correct path

// Buyurtma yaratish (Checkout)
// POST /api/orders
router.post("/", auth, async (req, res, next) => {
  const userId = req.user.id;
  const client = await db.getClient(); // Tranzaksiya uchun

  try {
    await client.query("BEGIN");

    // 1. Foydalanuvchining savatchasini va undagi mahsulotlarni topish
    const cartResult = await client.query(
      `SELECT ci.manga_id, ci.quantity, m.price, m.stock_quantity
       FROM cart_items ci
       JOIN mangas m ON ci.manga_id = m.id
       JOIN carts c ON ci.cart_id = c.id
       WHERE c.user_id = $1`,
      [userId]
    );

    const cartItems = cartResult.rows;

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Savatchangiz bo'sh." });
    }

    // 2. Mahsulotlar zaxirada yetarliligini tekshirish va umumiy summani hisoblash
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        // Agar biror mahsulot yetarli bo'lmasa, tranzaksiyani bekor qilamiz
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Kechirasiz, omborda faqat ${item.stock_quantity} dona mahsulot qolgan.`,
        });
      }
      totalAmount += item.price * item.quantity;
    }

    // 3. Yangi buyurtmani 'orders' jadvaliga qo'shish
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING id",
      [userId, totalAmount]
    );
    const newOrderId = orderResult.rows[0].id;

    // 4. Savatchadagi mahsulotlarni 'order_items'ga ko'chirish va zaxirani kamaytirish
    const orderItemsQuery = `INSERT INTO order_items (order_id, manga_id, quantity, price_per_item) VALUES ($1, $2, $3, $4)`;
    const updateStockQuery = `UPDATE mangas SET stock_quantity = stock_quantity - $1 WHERE id = $2`;

    for (const item of cartItems) {
      // Mahsulotni order_items'ga qo'shish
      await client.query(orderItemsQuery, [
        newOrderId,
        item.manga_id,
        item.quantity,
        item.price,
      ]);
      // Zaxirani kamaytirish
      await client.query(updateStockQuery, [item.quantity, item.manga_id]);
    }

    // 5. Foydalanuvchining savatchasini tozalash
    const cartIdResult = await client.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );
    const cartId = cartIdResult.rows[0].id;
    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

    // 6. Tranzaksiyani tasdiqlash
    await client.query("COMMIT");

    res.status(201).json({
      message: "Buyurtmangiz muvaffaqiyatli qabul qilindi!",
      orderId: newOrderId,
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Har qanday kutilmagan xatolikda tranzaksiyani bekor qilish
    next(err); // Xatolikni markaziy handler'ga uzatish
  } finally {
    client.release(); // Ulanishni pool'ga qaytarish
  }
});

// ADMIN: Barcha buyurtmalar ro'yxatini olish
// GET /api/orders/
router.get("/", [auth, admin], async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.username 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ADMIN: Buyurtma statusini o'zgartirish
// PUT /api/orders/:id/status
router.put("/:id/status", [auth, admin], async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // Status qiymatini validatsiya qilish
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Yaroqsiz status. Mumkin bo'lgan qiymatlar: ${validStatuses.join(
        ", "
      )}`,
    });
  }

  try {
    const result = await db.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Buyurtma topilmadi." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Foydalanuvchining o'z buyurtmalari tarixini olish
// GET /api/orders/my
router.get("/my", auth, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const { rows } = await db.query(
      `SELECT id, total_amount, status, created_at 
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Foydalanuvchining bitta buyurtmasi haqida to'liq ma'lumot olish
// GET /api/orders/:id
router.get("/:id", auth, async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Buyurtmaning o'zini va uning egasini tekshirish
    const orderResult = await db.query("SELECT * FROM orders WHERE id = $1", [
      id,
    ]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Buyurtma topilmadi." });
    }

    const order = orderResult.rows[0];

    // 2. Foydalanuvchi faqat o'zining buyurtmasini ko'ra olishini ta'minlash (admin bundan istisno)
    if (order.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Kirish huquqi yo'q." });
    }

    // 3. Buyurtma tarkibidagi mahsulotlarni olish
    const itemsResult = await db.query(
      `SELECT oi.manga_id, oi.quantity, oi.price_per_item, m.title, m.cover_image_url
       FROM order_items oi
       JOIN mangas m ON oi.manga_id = m.id
       WHERE oi.order_id = $1`,
      [id]
    );

    // Yakuniy natijani birlashtirish
    const fullOrderDetails = {
      ...order,
      items: itemsResult.rows,
    };

    res.json(fullOrderDetails);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
