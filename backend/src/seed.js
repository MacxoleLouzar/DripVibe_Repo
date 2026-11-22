require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  // Hash passwords
  const pass1 = await bcrypt.hash('password123', 10);
  const pass2 = await bcrypt.hash('password456', 10);

  // --- USERS ---
  const { rows: users } = await db.query(`
    INSERT INTO users (name, email, password, location, style_preferences) VALUES
      ('Alex Rivera', 'alex@dripvibe.com', $1, 'New York', ARRAY['casual','streetwear']),
      ('Jordan Lee',  'jordan@dripvibe.com', $2, 'Los Angeles', ARRAY['formal','minimalist'])
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, email
  `, [pass1, pass2]);

  const [user1, user2] = users;
  console.log('✅ Users:', users.map(u => u.email).join(', '));

  // --- WARDROBE ITEMS (3 per user) ---
  await db.query(`
    INSERT INTO wardrobe_items (user_id, name, category, color, brand, season, occasion, image_url, tags) VALUES
      ($1, 'White Oxford Shirt',    'tops',       'White',  'Uniqlo',   ARRAY['spring','summer'],       ARRAY['casual','work'],   '', ARRAY['shirt','white']),
      ($1, 'Slim Black Jeans',      'bottoms',    'Black',  'Zara',     ARRAY['fall','winter'],         ARRAY['casual','party'],  '', ARRAY['jeans','black']),
      ($1, 'White Sneakers',        'shoes',      'White',  'Nike',     ARRAY['spring','summer','fall'],ARRAY['casual','sport'],  '', ARRAY['sneakers']),
      ($2, 'Navy Blazer',           'outerwear',  'Navy',   'H&M',      ARRAY['fall','winter'],         ARRAY['formal','work'],   '', ARRAY['blazer','navy']),
      ($2, 'Floral Summer Dress',   'dresses',    'Floral', 'ASOS',     ARRAY['spring','summer'],       ARRAY['casual','party'],  '', ARRAY['dress','floral']),
      ($2, 'Gold Hoop Earrings',    'accessories','Gold',   'Mango',    ARRAY['spring','summer','fall'],ARRAY['casual','formal'], '', ARRAY['earrings','gold'])
    ON CONFLICT DO NOTHING
  `, [user1.id, user2.id]);
  console.log('✅ Wardrobe items seeded (3 per user)');

  // Fetch item IDs for outfits
  const { rows: items1 } = await db.query('SELECT id FROM wardrobe_items WHERE user_id = $1', [user1.id]);
  const { rows: items2 } = await db.query('SELECT id FROM wardrobe_items WHERE user_id = $1', [user2.id]);

  // --- OUTFITS (3 per user) ---
  await db.query(`
    INSERT INTO outfits (user_id, name, item_ids, occasion, weather, event, is_favorite, ai_generated) VALUES
      ($1, 'Casual Friday Look',   $3, 'casual', 'Sunny 22°C',  'casual',  true,  true),
      ($1, 'Weekend Chill',        $4, 'casual', 'Cloudy 18°C', 'casual',  false, true),
      ($1, 'Office Ready',         $5, 'work',   'Rainy 15°C',  'work',    false, true),
      ($2, 'Power Meeting',        $6, 'formal', 'Clear 20°C',  'formal',  true,  true),
      ($2, 'Summer Brunch',        $7, 'party',  'Sunny 28°C',  'party',   false, true),
      ($2, 'Date Night',           $8, 'party',  'Clear 21°C',  'party',   true,  true)
    ON CONFLICT DO NOTHING
  `, [
    user1.id, user2.id,
    items1.slice(0, 2).map(i => i.id),
    items1.slice(0, 1).map(i => i.id),
    items1.slice(0, 2).map(i => i.id),
    items2.slice(0, 2).map(i => i.id),
    items2.slice(0, 2).map(i => i.id),
    items2.map(i => i.id),
  ]);
  console.log('✅ Outfits seeded (3 per user)');

  console.log('\n🎉 Seed complete!');
  console.log('   alex@dripvibe.com   / password123');
  console.log('   jordan@dripvibe.com / password456');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
