import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

console.log('Testing connection to:', process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL, { connect_timeout: 10 });
sql`SELECT 1`.then(r => {
  console.log('Database connection success:', r);
  process.exit(0);
}).catch(e => {
  console.error('Database connection error:', e);
  process.exit(1);
});
