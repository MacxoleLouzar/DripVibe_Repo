const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { category, season, occasion } = req.query;
    let query = 'SELECT * FROM wardrobe_items WHERE user_id = $1';
    const params = [req.user.id];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    if (season)   { params.push(season);   query += ` AND $${params.length} = ANY(season)`; }
    if (occasion) { params.push(occasion); query += ` AND $${params.length} = ANY(occasion)`; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, category, color, brand, season, occasion, tags } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const { rows } = await db.query(
      `INSERT INTO wardrobe_items (user_id, name, category, color, brand, season, occasion, image_url, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        req.user.id, name, category,
        color || '', brand || '',
        season ? JSON.parse(season) : [],
        occasion ? JSON.parse(occasion) : [],
        imageUrl,
        tags ? JSON.parse(tags) : [],
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, category, color, brand, season, occasion, tags } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const existing = await db.query(
      'SELECT * FROM wardrobe_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return res.status(404).json({ message: 'Item not found' });
    const cur = existing.rows[0];
    const { rows } = await db.query(
      `UPDATE wardrobe_items SET
        name=$1, category=$2, color=$3, brand=$4, season=$5, occasion=$6,
        image_url=$7, tags=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [
        name || cur.name,
        category || cur.category,
        color ?? cur.color,
        brand ?? cur.brand,
        season ? JSON.parse(season) : cur.season,
        occasion ? JSON.parse(occasion) : cur.occasion,
        imageUrl || cur.image_url,
        tags ? JSON.parse(tags) : cur.tags,
        req.params.id, req.user.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM wardrobe_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
