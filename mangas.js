const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middleware/auth"); // auth middleware'ni import qilamiz
const admin = require("../middleware/admin"); // admin middleware'ni import qilamiz
// Barcha mangalar ro'yxatini ma'lumotlar bazasidan oladigan endpoint
// GET /api/mangas/
router.get("/", async (req, res) => {
  const { search, page = 1, genre } = req.query; // 'genre' parametrini qo'shamiz
  const limit = 8; // Har bir sahifada 8 ta mahsulot
  const offset = (page - 1) * limit;

  try {
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`m.title ILIKE $${paramIndex++}`);
      params.push(`%${search}%`);
    }

    if (genre) {
      // Janr bo'yicha filtrlash uchun sub-query (ichki so'rov)
      conditions.push(
        `m.id IN (SELECT manga_id FROM manga_genres WHERE genre_id = $${paramIndex++})`
      );
      params.push(genre);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Jami mahsulotlar sonini (filtr bilan) sanash uchun so'rov
    const countQuery = `SELECT COUNT(*) FROM mangas m ${whereClause}`;
    const totalResult = await db.query(countQuery, params);
    const totalMangas = parseInt(totalResult.rows[0].count, 10);
    const pageCount = Math.ceil(totalMangas / limit);

    // Sahifadagi mahsulotlarni olish uchun so'rov
    const mangasQuery = `
      SELECT m.id, m.title, m.price, m.cover_image_url, a.name AS author_name 
      FROM mangas m 
      JOIN authors a ON m.author_id = a.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const mangasResult = await db.query(mangasQuery, params);

    // Javob sifatida mahsulotlar, joriy sahifa va jami sahifalar sonini qaytaramiz
    res.json({
      mangas: mangasResult.rows,
      page,
      pageCount,
    });
  } catch (err) {
    next(err);
  }
});

// ID bo'yicha bitta manga haqida to'liq ma'lumot qaytaradigan endpoint
// GET /api/mangas/:id
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    // LEFT JOIN va GROUP_BY yordamida janrlarni bitta so'rovda olish
    const query = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.price,
        m.author_id,
        m.cover_image_url,
        m.stock_quantity,
        a.name AS author_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]'::json) AS genres
      FROM mangas m
      LEFT JOIN authors a ON m.author_id = a.id
      LEFT JOIN manga_genres mg ON m.id = mg.manga_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE m.id = $1
      GROUP BY m.id, a.name;
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Bunday IDga ega manga topilmadi" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Yangi manga qo'shish uchun endpoint (POST so'rovi)
// POST /api/mangas/
router.post("/", [auth, admin], async (req, res, next) => {
  const {
    title,
    author_id,
    description,
    price,
    stock_quantity,
    cover_image_url,
    genre_ids,
  } = req.body;

  if (
    !title ||
    !author_id ||
    !price ||
    !genre_ids ||
    !Array.isArray(genre_ids)
  ) {
    return res.status(400).json({
      error:
        "Iltimos, barcha kerakli maydonlarni to'ldiring: title, author_id, price, genre_ids (massiv).",
    });
  }

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const insertMangaQuery = `
      INSERT INTO mangas(title, author_id, description, price, stock_quantity, cover_image_url)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING id; 
    `;
    const mangaResult = await client.query(insertMangaQuery, [
      title,
      author_id,
      description,
      price,
      stock_quantity,
      cover_image_url,
    ]);
    const newMangaId = mangaResult.rows[0].id;

    const insertGenresQuery =
      "INSERT INTO manga_genres(manga_id, genre_id) VALUES ($1, $2)";
    await Promise.all(
      genre_ids.map((genreId) =>
        client.query(insertGenresQuery, [newMangaId, genreId])
      )
    );

    await client.query("COMMIT");
    res.status(201).json({
      id: newMangaId,
      title,
      message: "Manga muvaffaqiyatli qo'shildi",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// Mavjud mangani tahrirlash uchun endpoint (PUT so'rovi)
// PUT /api/mangas/:id
router.put("/:id", [auth, admin], async (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    author_id,
    description,
    price,
    stock_quantity,
    cover_image_url,
    genre_ids,
  } = req.body;

  if (
    !title ||
    !author_id ||
    !price ||
    !genre_ids ||
    !Array.isArray(genre_ids)
  ) {
    return res.status(400).json({
      error:
        "Iltimos, barcha kerakli maydonlarni to'ldiring: title, author_id, price, genre_ids (massiv).",
    });
  }

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const updateMangaQuery = `
      UPDATE mangas
      SET title = $1, author_id = $2, description = $3, price = $4, stock_quantity = $5, cover_image_url = $6
      WHERE id = $7
      RETURNING *;
    `;
    const mangaResult = await client.query(updateMangaQuery, [
      title,
      author_id,
      description,
      price,
      stock_quantity,
      cover_image_url,
      id,
    ]);

    if (mangaResult.rows.length === 0) {
      throw new Error("Manga not found");
    }

    await client.query("DELETE FROM manga_genres WHERE manga_id = $1", [id]);

    const insertGenresQuery =
      "INSERT INTO manga_genres(manga_id, genre_id) VALUES ($1, $2)";
    await Promise.all(
      genre_ids.map((genreId) => client.query(insertGenresQuery, [id, genreId]))
    );

    await client.query("COMMIT");
    res.status(200).json(mangaResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.message === "Manga not found") {
      return res.status(404).json({ error: "Bunday IDga ega manga topilmadi" });
    }
    next(err);
  } finally {
    client.release();
  }
});

// Mangani o'chirish uchun endpoint (DELETE so'rovi)
// DELETE /api/mangas/:id
router.delete("/:id", [auth, admin], async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM mangas WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bunday IDga ega manga topilmadi" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
