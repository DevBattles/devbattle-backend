import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is missing in environment variables');
  process.exit(1);
}

// Connections for migration should run sequentially (max: 1 connection)
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

const runMigrations = async () => {
  try {
    console.log('⏳ Running Drizzle migrations...');
    // Since migrate.js is inside drizzle/, the migration files are in the same folder (__dirname)
    await migrate(db, { migrationsFolder: __dirname });
    console.log('✅ Database migrations successfully applied!');
    await migrationClient.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error: Migration execution failed', error);
    await migrationClient.end();
    process.exit(1);
  }
};

runMigrations();
