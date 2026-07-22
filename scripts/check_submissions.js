import { db } from '../src/db/index.js';
import { homeworkSubmissions, users, homeworks } from '../src/schema/index.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const list = await db.select().from(homeworkSubmissions);
    console.log('--- ALL HOMEWORK SUBMISSIONS ---');
    console.log(list);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
