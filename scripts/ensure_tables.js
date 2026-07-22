import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const client = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    console.log('Fixing batch_join_requests table columns...');
    
    // Add updated_at column if not exists
    await client`
      ALTER TABLE batch_join_requests 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `;
    
    console.log('✅ batch_join_requests table updated_at column verified/added.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error updating table:', err);
    await client.end();
    process.exit(1);
  }
}

main();
