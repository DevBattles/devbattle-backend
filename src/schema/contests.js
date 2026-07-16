import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { questionBank } from './questions.js';

export const contestStatusEnum = pgEnum('contest_status', ['draft', 'published', 'started', 'ended']);

export const contests = pgTable('contests', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  published: boolean('published').default(false).notNull(),
  status: contestStatusEnum('status').default('draft').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contestQuestions = pgTable('contest_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  contestId: uuid('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questionBank.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  points: integer('points').default(100).notNull(),
});

export const contestParticipants = pgTable('contest_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  contestId: uuid('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const contestSubmissions = pgTable('contest_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  contestId: uuid('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questionBank.id, { onDelete: 'cascade' }),
  questionVersion: integer('question_version').notNull(),
  files: jsonb('files').notNull(),
  githubRepo: varchar('github_repo', { length: 500 }),
  livePreview: varchar('live_preview', { length: 500 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  score: integer('score'),
  grade: varchar('grade', { length: 10 }),
  feedback: text('feedback'),
  report: jsonb('report'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
