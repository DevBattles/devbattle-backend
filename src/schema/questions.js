import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const difficultyEnum = pgEnum('question_difficulty', ['easy', 'medium', 'hard']);
export const categoryEnum = pgEnum('question_category', [
  'html',
  'css',
  'javascript',
  'react',
  'tailwind',
  'nextjs',
  'node',
  'express',
  'mongodb',
  'rest_api',
  'authentication',
  'responsive_design',
  'portfolio',
  'landing_page',
  'dashboard',
  'netflix_clone',
  'todo_app',
  'bug_fixing',
  'code_review',
  'figma_to_react'
]);

export const questionBank = pgTable('question_bank', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  estimatedTime: varchar('estimated_time', { length: 50 }).notNull(),
  techStack: jsonb('tech_stack').notNull(),
  tags: jsonb('tags'),
  requirements: jsonb('requirements'),
  starterFiles: jsonb('starter_files'),
  assets: jsonb('assets'),
  attachments: jsonb('attachments'),
  expectedOutput: text('expected_output'),
  version: integer('version').default(1).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questionVersions = pgTable('question_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').notNull().references(() => questionBank.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  techStack: jsonb('tech_stack').notNull(),
  starterFiles: jsonb('starter_files'),
  expectedOutput: text('expected_output'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questionProgress = pgTable('question_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questionBank.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('not_started'),
  score: integer('score'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  attempts: integer('attempts').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
