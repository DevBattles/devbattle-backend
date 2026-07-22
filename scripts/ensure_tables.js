import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const client = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    console.log('Ensuring batch_join_requests table exists...');
    await client`
      CREATE TABLE IF NOT EXISTS batch_join_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ batch_join_requests table is ready.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error ensuring table:', err);
    await client.end();
    process.exit(1);
  }
}

main();
