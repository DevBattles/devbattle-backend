import { db } from '../src/db/index.js';
import { batchJoinRequests, users, batches } from '../src/schema/index.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    console.log('Testing batchJoinRequests query...');
    const list = await db.select().from(batchJoinRequests);
    console.log('✅ Query succeeded. Total requests:', list.length);
    process.exit(0);
  } catch (err) {
    console.error('❌ Query failed:', err);
    process.exit(1);
  }
}

test();
