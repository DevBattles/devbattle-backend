import dotenv from 'dotenv';
dotenv.config();
import { db } from '../src/db/index.js';
import { analyticsEvents } from '../src/schema/analytics.js';

async function test() {
  try {
    const list = await db.select().from(analyticsEvents).limit(1);
    console.log('Existing events:', list);
  } catch (error) {
    console.error('Error fetching events:', error);
  }
  process.exit(0);
}

test();
