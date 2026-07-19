import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow().notNull(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  downloadUrl: varchar('download_url', { length: 500 }),
  verificationCode: varchar('verification_code', { length: 100 }).unique().notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
