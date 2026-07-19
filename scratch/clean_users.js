import dotenv from 'dotenv';
import { db } from '../src/db/index.js';
import { users } from '../src/schema/index.js';

dotenv.config();

async function clean() {
  console.log('🧹 Clearing all users from database...');
  try {
    const result = await db.delete(users);
    console.log('✅ Successfully cleared all users from database.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear users:', error);
    process.exit(1);
  }
}
clean();
