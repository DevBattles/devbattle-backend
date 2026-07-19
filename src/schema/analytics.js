import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const leaderboardTypeEnum = pgEnum('leaderboard_type', [
  'global',
  'contest',
  'homework',
  'weekly',
  'monthly',
  'department',
  'college'
]);

export const leaderboards = pgTable('leaderboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').default(0).notNull(),
  rank: integer('rank').notNull(),
  type: leaderboardTypeEnum('type').notNull(),
  contextId: uuid('context_id'), // contestId, homeworkId, departmentId, collegeId depending on type
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: jsonb('event_data'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
