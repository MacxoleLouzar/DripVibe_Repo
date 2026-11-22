require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const authRoutes = require('./routes/auth');
const wardrobeRoutes = require('./routes/wardrobe');
const outfitRoutes = require('./routes/outfit');
const weatherRoutes = require('./routes/weather');
const shopRoutes = require('./routes/shop');
const imageSearchRoutes = require('./routes/imageSearch');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/outfit', outfitRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/image-search', imageSearchRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'DripVibe API running', db: 'PostgreSQL connected' });
  } catch {
    res.status(500).json({ status: 'DB connection failed' });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`DripVibe server on port ${process.env.PORT || 5000}`)
);
