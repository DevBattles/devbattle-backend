import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const notificationTypeEnum = pgEnum('notification_type', [
  'homework_assigned',
  'contest_published',
  'contest_started',
  'submission_reviewed',
  'certificate_issued',
  'general'
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
