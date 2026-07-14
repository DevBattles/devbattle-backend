import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const client = postgres(process.env.DATABASE_URL);

async function dropAll() {
  try {
    console.log('Attempting to drop existing users table, drizzle schema, and metadata...');
    await client`DROP TABLE IF EXISTS "users" CASCADE;`;
    await client`DROP SCHEMA IF EXISTS "drizzle" CASCADE;`;
    await client`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;`;
    console.log('✅ All tables and Drizzle metadata cleaned.');
    await client.end();
  } catch (err) {
    console.error('❌ Failed to cleanup database:', err.message);
    await client.end();
  }
}

dropAll();
