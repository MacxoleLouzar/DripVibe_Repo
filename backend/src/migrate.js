const db = require('./db');

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      location VARCHAR(255) DEFAULT '',
      style_preferences TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wardrobe_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('tops','bottoms','shoes','accessories','outerwear','dresses')),
      color VARCHAR(100) DEFAULT '',
      brand VARCHAR(100) DEFAULT '',
      season TEXT[] DEFAULT '{}',
      occasion TEXT[] DEFAULT '{}',
      image_url VARCHAR(500) DEFAULT '',
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) DEFAULT '',
      item_ids UUID[] DEFAULT '{}',
      occasion VARCHAR(100) DEFAULT '',
      weather VARCHAR(100) DEFAULT '',
      event VARCHAR(100) DEFAULT '',
      is_favorite BOOLEAN DEFAULT FALSE,
      ai_generated BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      token VARCHAR(255) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Tables created successfully');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => { console.error('Migration failed:', err); process.exit(1); });
