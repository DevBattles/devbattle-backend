import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const client = postgres(process.env.DATABASE_URL);

async function check() {
  try {
    const tables = await client`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `;
    console.log('Tables in public schema:');
    console.log(tables);
    await client.end();
  } catch (err) {
    console.error(err);
    await client.end();
  }
}

check();
