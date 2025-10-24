const express = require("express");
const router = express.Router();
const db = require("../db");

// Barcha mualliflar ro'yxatini olish
// GET /api/authors
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM authors ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching authors", err.stack);
    res.status(500).json({ error: "Serverda ichki xatolik yuz berdi" });
  }
});

module.exports = router;
