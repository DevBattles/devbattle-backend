import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from '../schema/users.js';
import logger from '../logger/logger.js';

// For long-running server, we can specify connection options if needed.
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export const checkDbConnection = async () => {
  try {
    await queryClient`SELECT 1`;
    logger.info('Database connection established successfully.');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', { error: error.message });
    throw error;
  }
};
