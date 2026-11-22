const express = require('express');
const axios = require('axios');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const STORES = [
  { store: 'ZARA',              link: 'https://www.zara.com',                    rating: 4.2, reviews: 12400, tags: ['tops','bottoms','dresses','outerwear','accessories'] },
  { store: 'H&M',               link: 'https://www.hm.com',                      rating: 4.0, reviews: 9800,  tags: ['tops','bottoms','dresses','outerwear','accessories'] },
  { store: 'ASOS',              link: 'https://www.asos.com',                    rating: 4.3, reviews: 21000, tags: ['tops','bottoms','dresses','shoes','outerwear','accessories'] },
  { store: 'Nike',              link: 'https://www.nike.com',                    rating: 4.7, reviews: 54000, tags: ['shoes','tops','bottoms'] },
  { store: 'Adidas',            link: 'https://www.adidas.com',                  rating: 4.6, reviews: 48000, tags: ['shoes','tops','bottoms','outerwear'] },
  { store: 'Puma',              link: 'https://www.puma.com',                    rating: 4.4, reviews: 22000, tags: ['shoes','tops','bottoms'] },
  { store: 'Uniqlo',            link: 'https://www.uniqlo.com',                  rating: 4.5, reviews: 32000, tags: ['tops','bottoms','outerwear'] },
  { store: 'Nordstrom',         link: 'https://www.nordstrom.com',               rating: 4.4, reviews: 18000, tags: ['tops','bottoms','dresses','shoes','outerwear','accessories'] },
  { store: 'Mango',             link: 'https://www.mango.com',                   rating: 4.1, reviews: 8700,  tags: ['tops','bottoms','dresses','outerwear','accessories'] },
  { store: 'Forever 21',        link: 'https://www.forever21.com',               rating: 3.9, reviews: 6400,  tags: ['tops','bottoms','dresses','accessories'] },
  { store: 'Shein',             link: 'https://www.shein.com',                   rating: 3.8, reviews: 95000, tags: ['tops','bottoms','dresses','shoes','accessories','outerwear'] },
  { store: 'Temu',              link: 'https://www.temu.com',                    rating: 3.7, reviews: 72000, tags: ['tops','bottoms','dresses','shoes','accessories'] },
  { store: 'Studio 88',         link: 'https://www.studio88.co.za',              rating: 4.1, reviews: 3200,  tags: ['shoes','tops','bottoms','accessories'] },
  { store: 'Superbalist',       link: 'https://superbalist.com',                 rating: 4.3, reviews: 5600,  tags: ['tops','bottoms','dresses','shoes','outerwear','accessories'] },
  { store: 'Mr Price',          link: 'https://www.mrprice.com',                 rating: 4.0, reviews: 4100,  tags: ['tops','bottoms','dresses','shoes','accessories','outerwear'] },
  { store: 'Woolworths',        link: 'https://www.woolworths.co.za',            rating: 4.4, reviews: 6800,  tags: ['tops','bottoms','dresses','shoes','outerwear','accessories'] },
  { store: 'Cotton On',         link: 'https://cottonon.com',                    rating: 4.1, reviews: 7200,  tags: ['tops','bottoms','dresses','accessories'] },
  { store: 'PrettyLittleThing', link: 'https://www.prettylittlething.com',       rating: 3.9, reviews: 31000, tags: ['tops','bottoms','dresses','shoes','accessories'] },
  { store: 'Boohoo',            link: 'https://www.boohoo.com',                  rating: 3.8, reviews: 28000, tags: ['tops','bottoms','dresses','shoes','accessories','outerwear'] },
  { store: 'New Balance',       link: 'https://www.newbalance.com',              rating: 4.5, reviews: 19000, tags: ['shoes','tops','bottoms'] },
];

const CATEGORY_SEARCH = {
  tops:        'fashion shirt top clothing',
  bottoms:     'fashion jeans trousers pants',
  dresses:     'fashion dress women outfit',
  shoes:       'fashion sneakers shoes footwear',
  outerwear:   'fashion jacket coat outerwear',
  accessories: 'fashion accessories watch bag',
};

async function categoryImage(cat) {
  const query = CATEGORY_SEARCH[cat] || `${cat} fashion clothing`;
  if (process.env.UNSPLASH_ACCESS_KEY && process.env.UNSPLASH_ACCESS_KEY !== 'your_unsplash_access_key') {
    try {
      const page = Math.floor(Math.random() * 5) + 1;
      const { data } = await axios.get('https://api.unsplash.com/search/photos', {
        params: { query, per_page: 10, page, orientation: 'portrait' },
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      });
      const results = data.results;
      if (results?.length) {
        const img = results[Math.floor(Math.random() * results.length)];
        return img.urls.regular;
      }
    } catch {}
  }
  return `https://placehold.co/400x560/1a1a1a/c8a96e?text=${encodeURIComponent(cat)}`;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const pickStore = (category) => {
  const pool = STORES.filter(s => s.tags.includes(category));
  return pick(pool.length ? pool : STORES);
};

const itemDescription = (name, occasion, weather) => {
  const temp = weather?.temp ?? 22;
  const season = temp < 10 ? 'winter' : temp < 18 ? 'autumn' : temp < 25 ? 'spring' : 'summer';
  return `Perfect ${season} ${occasion} piece. ${name} pairs effortlessly with your look and is available in multiple colors.`;
};

function suggestFromWardrobe(items, weather, event, gender) {
  const temp = weather?.temp ?? 20;
  const occasion = event?.toLowerCase() ?? 'casual';

  const genderFiltered = items.filter(i =>
    !i.tags?.length || i.tags.includes(gender) || (!i.tags.includes('male') && !i.tags.includes('female'))
  );

  const byCategory = (cat) => genderFiltered.filter(i => i.category === cat);
  const matchOccasion = (arr) => {
    const matched = arr.filter(i => i.occasion?.includes(occasion));
    return matched.length ? matched : arr;
  };

  const tops        = byCategory('tops');
  const bottoms     = byCategory('bottoms');
  const shoes       = byCategory('shoes');
  const outerwear   = byCategory('outerwear');
  const dresses     = byCategory('dresses');
  const accessories = byCategory('accessories');

  const outfit = [];

  if (occasion === 'formal' || occasion === 'work') {
    if (gender === 'female') {
      const dress = pick(matchOccasion(dresses));
      if (dress) {
        outfit.push(dress);
      } else {
        const top = pick(matchOccasion(tops));
        const bottom = pick(matchOccasion(bottoms));
        if (top) outfit.push(top);
        if (bottom) outfit.push(bottom);
      }
    } else {
      const top = pick(matchOccasion(tops));
      const bottom = pick(matchOccasion(bottoms));
      if (top) outfit.push(top);
      if (bottom) outfit.push(bottom);
    }
  } else {
    const top = pick(matchOccasion(tops));
    const bottom = pick(matchOccasion(bottoms));
    if (top) outfit.push(top);
    if (bottom) outfit.push(bottom);
  }

  if (temp < 15 && outerwear.length) outfit.push(pick(outerwear));
  const shoe = pick(matchOccasion(shoes));
  if (shoe) outfit.push(shoe);
  const acc = pick(matchOccasion(accessories));
  if (acc) outfit.push(acc);

  return outfit.filter(Boolean);
}

async function generateAIOutfit(weather, event, gender) {
  const temp = weather?.temp ?? 22;
  const occasion = event?.toLowerCase() ?? 'casual';
  const isCold = temp < 15;
  const isHot = temp > 25;

  const templates = {
    male: {
      casual: [
        { category: 'tops',        name: isCold ? 'Cozy Knit Sweater' : isHot ? 'Linen Short-Sleeve Shirt' : 'Classic Crew-Neck Tee' },
        { category: 'bottoms',     name: isCold ? 'Slim Chino Trousers' : 'Straight-Leg Jeans' },
        { category: 'shoes',       name: isHot ? 'Canvas Sneakers' : 'White Leather Sneakers' },
        { category: 'accessories', name: 'Minimalist Watch' },
        ...(isCold ? [{ category: 'outerwear', name: 'Wool Overcoat' }] : []),
      ],
      formal: [
        { category: 'tops',        name: 'Crisp White Dress Shirt' },
        { category: 'bottoms',     name: 'Tailored Slim Trousers' },
        { category: 'outerwear',   name: 'Single-Breasted Blazer' },
        { category: 'shoes',       name: 'Oxford Leather Shoes' },
        { category: 'accessories', name: 'Silk Tie' },
      ],
      work: [
        { category: 'tops',        name: 'Oxford Button-Down Shirt' },
        { category: 'bottoms',     name: 'Chino Trousers' },
        { category: 'shoes',       name: 'Derby Shoes' },
        { category: 'accessories', name: 'Leather Belt' },
        ...(isCold ? [{ category: 'outerwear', name: 'Trench Coat' }] : []),
      ],
      sport: [
        { category: 'tops',        name: 'Moisture-Wicking Polo' },
        { category: 'bottoms',     name: 'Athletic Joggers' },
        { category: 'shoes',       name: 'Running Sneakers' },
        { category: 'accessories', name: 'Sports Cap' },
      ],
      party: [
        { category: 'tops',        name: 'Slim-Fit Printed Shirt' },
        { category: 'bottoms',     name: 'Dark Slim Jeans' },
        { category: 'shoes',       name: 'Chelsea Boots' },
        { category: 'accessories', name: 'Statement Watch' },
      ],
    },
    female: {
      casual: [
        { category: 'tops',        name: isCold ? 'Ribbed Turtleneck' : isHot ? 'Flowy Crop Top' : 'Oversized Graphic Tee' },
        { category: 'bottoms',     name: isCold ? 'High-Waist Straight Jeans' : isHot ? 'Linen Wide-Leg Pants' : 'Mom Jeans' },
        { category: 'shoes',       name: isHot ? 'Strappy Sandals' : 'White Sneakers' },
        { category: 'accessories', name: 'Layered Gold Necklace' },
        ...(isCold ? [{ category: 'outerwear', name: 'Camel Wool Coat' }] : []),
      ],
      formal: [
        { category: 'dresses',     name: 'Midi Wrap Dress' },
        { category: 'shoes',       name: 'Block Heel Pumps' },
        { category: 'accessories', name: 'Pearl Earrings' },
        ...(isCold ? [{ category: 'outerwear', name: 'Tailored Blazer' }] : []),
      ],
      work: [
        { category: 'tops',        name: 'Silk Blouse' },
        { category: 'bottoms',     name: 'Pencil Skirt' },
        { category: 'shoes',       name: 'Pointed-Toe Flats' },
        { category: 'accessories', name: 'Structured Tote Bag' },
        ...(isCold ? [{ category: 'outerwear', name: 'Longline Blazer' }] : []),
      ],
      sport: [
        { category: 'tops',        name: 'Sports Bra & Tank Set' },
        { category: 'bottoms',     name: 'High-Waist Leggings' },
        { category: 'shoes',       name: 'Training Sneakers' },
        { category: 'accessories', name: 'Scrunchie Set' },
      ],
      party: [
        { category: 'dresses',     name: 'Sequin Mini Dress' },
        { category: 'shoes',       name: 'Strappy Heels' },
        { category: 'accessories', name: 'Clutch Bag' },
      ],
    },
  };

  const items = (templates[gender]?.[occasion] || templates[gender]?.casual || []);

  return await Promise.all(items.map(async (item, idx) => {
    const store = pickStore(item.category);
    return {
      ...item,
      id: `ai-${idx}`,
      isAI: true,
      store: store.store,
      storeLink: store.link,
      price: `R${(Math.random() * 1200 + 150).toFixed(0)}`,
      rating: store.rating,
      reviews: store.reviews,
      description: itemDescription(item.name, occasion, weather),
      image_url: await categoryImage(item.category),
    };
  }));
}

router.post('/suggest', auth, async (req, res) => {
  try {
    const { weather, event, occasion, gender = 'male', mode = 'wardrobe' } = req.body;
    if (mode === 'ai') {
      return res.json({ outfit: await generateAIOutfit(weather, event || occasion, gender) });
    }
    const { rows } = await db.query('SELECT * FROM wardrobe_items WHERE user_id = $1', [req.user.id]);
    if (!rows.length) return res.status(400).json({ message: 'Add items to your wardrobe first' });
    res.json({ outfit: suggestFromWardrobe(rows, weather, event || occasion, gender) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { rows: outfits } = await db.query(
      'SELECT * FROM outfits WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const result = await Promise.all(
      outfits.map(async (o) => {
        let items = [];
        if (o.item_ids?.length) {
          const { rows } = await db.query('SELECT * FROM wardrobe_items WHERE id = ANY($1)', [o.item_ids]);
          items = rows;
        }
        return { ...o, items };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/save', auth, async (req, res) => {
  try {
    const { name, items, occasion, weather, event } = req.body;
    const { rows } = await db.query(
      `INSERT INTO outfits (user_id, name, item_ids, occasion, weather, event, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name || `Outfit ${Date.now()}`, items || [], occasion || '', weather || '', event || '', true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/favorite', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE outfits SET is_favorite = NOT is_favorite, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM outfits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
