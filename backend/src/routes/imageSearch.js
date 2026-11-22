const express = require('express');
const axios = require('axios');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { query } = req.body;
    const searchTerm = query || 'clothing outfit';

    const results = await findSimilarInStores(searchTerm);
    res.json({
      message: 'Similar items found',
      searchTerm,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function findSimilarInStores(query) {
  if (!process.env.SERPAPI_KEY || process.env.SERPAPI_KEY === 'your_serpapi_key') {
    return getMockImageSearchResults(query);
  }
  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: process.env.SERPAPI_KEY,
        num: 8,
      },
    });
    return (data.shopping_results || []).slice(0, 8).map(item => ({
      title: item.title,
      price: item.price,
      store: item.source,
      link: item.link,
      image: item.thumbnail,
      rating: item.rating || null,
      reviews: item.reviews || null,
      storeReview: getStoreReview(item.source),
    }));
  } catch {
    return getMockImageSearchResults(query);
  }
}

function getStoreReview(storeName) {
  const reviews = {
    ZARA: { rating: 4.2, summary: 'Trendy styles, fast fashion, good quality for price' },
    'H&M': { rating: 4.0, summary: 'Affordable basics, wide size range, sustainable options' },
    ASOS: { rating: 4.3, summary: 'Huge selection, great for online shopping, easy returns' },
    Nike: { rating: 4.6, summary: 'Premium quality, excellent for sportswear and sneakers' },
    Uniqlo: { rating: 4.5, summary: 'Minimalist, high quality basics, great value' },
    Nordstrom: { rating: 4.4, summary: 'Premium brands, excellent customer service' },
  };
  return reviews[storeName] || { rating: 4.0, summary: 'Reputable online retailer' };
}

function getMockImageSearchResults(query) {
  const stores = [
    { store: 'ZARA', price: '$49.99', link: 'https://www.zara.com' },
    { store: 'H&M', price: '$29.99', link: 'https://www.hm.com' },
    { store: 'ASOS', price: '$39.99', link: 'https://www.asos.com' },
    { store: 'Nike', price: '$89.99', link: 'https://www.nike.com' },
    { store: 'Uniqlo', price: '$34.99', link: 'https://www.uniqlo.com' },
    { store: 'Nordstrom', price: '$79.99', link: 'https://www.nordstrom.com' },
    { store: 'Forever 21', price: '$19.99', link: 'https://www.forever21.com' },
    { store: 'Mango', price: '$44.99', link: 'https://www.mango.com' },
  ];
  return stores.map(s => ({
    title: `${query} - ${s.store}`,
    price: s.price,
    store: s.store,
    link: s.link,
    image: `https://placehold.co/200x200/1a1a1a/c8a96e?text=${encodeURIComponent(s.store)}`,
    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    reviews: Math.floor(Math.random() * 3000 + 200),
    storeReview: getStoreReview(s.store),
  }));
}

module.exports = router;
