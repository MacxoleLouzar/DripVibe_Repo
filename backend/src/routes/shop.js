const express = require('express');
const axios = require('axios');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/suggestions', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT category FROM wardrobe_items WHERE user_id = $1', [req.user.id]);
    const categories = rows.map(i => i.category);
    const gaps = [];

    const essentials = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'];
    essentials.forEach(cat => {
      const count = categories.filter(c => c === cat).length;
      if (count === 0) gaps.push({ category: cat, reason: `You have no ${cat} in your wardrobe` });
      else if (count < 2) gaps.push({ category: cat, reason: `You only have ${count} ${cat}` });
    });

    const shopResults = await Promise.all(gaps.map(g => searchStores(g.category)));
    const suggestions = gaps.map((gap, i) => ({ ...gap, stores: shopResults[i] }));

    res.json({ gaps, suggestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Query required' });
    const results = await searchStores(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function searchStores(query) {
  if (!process.env.SERPAPI_KEY || process.env.SERPAPI_KEY === 'your_serpapi_key') {
    return getMockStoreResults(query);
  }
  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: { engine: 'google_shopping', q: `${query} clothing`, api_key: process.env.SERPAPI_KEY, num: 6 },
    });
    return (data.shopping_results || []).slice(0, 6).map(item => ({
      title: item.title, price: item.price, store: item.source,
      link: item.link, image: item.thumbnail, rating: item.rating, reviews: item.reviews,
    }));
  } catch {
    return getMockStoreResults(query);
  }
}

function getMockStoreResults(query) {
  const stores = [
    { store: 'ZARA', baseUrl: 'https://www.zara.com', rating: 4.2, reviews: 1240 },
    { store: 'H&M', baseUrl: 'https://www.hm.com', rating: 4.0, reviews: 980 },
    { store: 'ASOS', baseUrl: 'https://www.asos.com', rating: 4.3, reviews: 2100 },
    { store: 'Nike', baseUrl: 'https://www.nike.com', rating: 4.6, reviews: 5400 },
    { store: 'Uniqlo', baseUrl: 'https://www.uniqlo.com', rating: 4.5, reviews: 3200 },
    { store: 'Nordstrom', baseUrl: 'https://www.nordstrom.com', rating: 4.4, reviews: 1800 },
  ];
  return stores.map(s => ({
    title: `${query} - ${s.store} Collection`,
    price: `$${(Math.random() * 80 + 20).toFixed(2)}`,
    store: s.store, link: s.baseUrl,
    image: `https://placehold.co/200x200/1a1a1a/c8a96e?text=${encodeURIComponent(query)}`,
    rating: s.rating, reviews: s.reviews,
  }));
}

module.exports = router;
