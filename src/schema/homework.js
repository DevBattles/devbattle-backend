import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { questionBank } from './questions.js';

export const homeworkStatusEnum = pgEnum('homework_status', ['draft', 'published', 'archived']);

export const homeworks = pgTable('homeworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const homeworkQuestions = pgTable('homework_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  homeworkId: uuid('homework_id').notNull().references(() => homeworks.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questionBank.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
});

export const homeworkAssignments = pgTable('homework_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  homeworkId: uuid('homework_id').notNull().references(() => homeworks.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }),
  batch: varchar('batch', { length: 100 }),
  assignedBy: uuid('assigned_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
});

export const homeworkSubmissions = pgTable('homework_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  homeworkId: uuid('homework_id').notNull().references(() => homeworks.id, { onDelete: 'cascade' }),
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
