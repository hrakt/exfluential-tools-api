require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

const db = drizzle(pool);

async function initDb() {
    // one-time table creation; in a real app you'd use migrations
    await pool.query(`
    CREATE TABLE IF NOT EXISTS tools (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

module.exports = {
    db,
    initDb
}