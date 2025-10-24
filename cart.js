const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

// Foydalanuvchining savatchasini topish yoki yaratish uchun yordamchi funksiya
const findOrCreateCart = async (userId) => {
  let cart = await db.query("SELECT * FROM carts WHERE user_id = $1", [userId]);

  if (cart.rows.length === 0) {
    // Agar savatcha mavjud bo'lmasa, yangisini yaratamiz
    cart = await db.query(
      "INSERT INTO carts (user_id) VALUES ($1) RETURNING *",
      [userId]
    );
  }
  return cart.rows[0];
};

// Savatchaga mahsulot qo'shish
// POST /api/cart/items
router.post("/items", auth, async (req, res) => {
  const { manga_id, quantity = 1 } = req.body;
  const userId = req.user.id;

  if (!manga_id || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "manga_id va to'g'ri quantity kiritilishi shart." });
  }

  try {
    const cart = await findOrCreateCart(userId);

    // ON CONFLICT...DO UPDATE - bu PostgreSQL'ning kuchli xususiyati.
    // Agar cart_id va manga_id juftligi allaqachon mavjud bo'lsa (UNIQUE cheklovi tufayli),
    // INSERT o'rniga UPDATE bajariladi, ya'ni mahsulot soni mavjudiga qo'shiladi.
    const query = `
        INSERT INTO cart_items (cart_id, manga_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (cart_id, manga_id)
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
        RETURNING *;
    `;

    const { rows } = await db.query(query, [cart.id, manga_id, quantity]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Foydalanuvchining savatchasidagi barcha mahsulotlarni olish
// GET /api/cart
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await findOrCreateCart(userId);

    const query = `
        SELECT 
            ci.manga_id,
            m.title,
            m.price,
            ci.quantity,
            m.cover_image_url
        FROM cart_items ci
        JOIN mangas m ON ci.manga_id = m.id
        WHERE ci.cart_id = $1
        ORDER BY m.title;
    `;

    const { rows } = await db.query(query, [cart.id]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Savatchadagi mahsulot sonini o'zgartirish
// PUT /api/cart/items/:manga_id
router.put("/items/:manga_id", auth, async (req, res) => {
  const { manga_id } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (!quantity || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "Yaroqli 'quantity' qiymati kiritilishi shart." });
  }

  try {
    const cart = await findOrCreateCart(userId);

    const query = `
        UPDATE cart_items
        SET quantity = $1
        WHERE cart_id = $2 AND manga_id = $3
        RETURNING *;
    `;

    const { rows, rowCount } = await db.query(query, [
      quantity,
      cart.id,
      manga_id,
    ]);

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Bu mahsulot savatchada topilmadi." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Savatchadan bitta mahsulotni o'chirish
// DELETE /api/cart/items/:manga_id
router.delete("/items/:manga_id", auth, async (req, res) => {
  const { manga_id } = req.params;
  const userId = req.user.id;

  try {
    const cart = await findOrCreateCart(userId);

    const result = await db.query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND manga_id = $2",
      [cart.id, manga_id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Bu mahsulot savatchada topilmadi." });
    }

    res.status(204).send(); // Muvaffaqiyatli o'chirildi, qaytaradigan ma'lumot yo'q
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
