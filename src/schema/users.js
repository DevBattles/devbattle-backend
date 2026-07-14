import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('devbattle_role', ['student', 'teacher']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').default('student').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
