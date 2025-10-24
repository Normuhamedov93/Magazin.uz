const express = require("express");
const router = express.Router();
const db = require("../db");

// Barcha janrlar ro'yxatini olish
// GET /api/genres
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM genres ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching genres", err.stack);
    res.status(500).json({ error: "Serverda ichki xatolik yuz berdi" });
  }
});

module.exports = router;
