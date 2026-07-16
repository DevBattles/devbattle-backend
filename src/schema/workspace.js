import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { questionBank } from './questions.js';

export const workspaceProjects = pgTable('workspace_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').references(() => questionBank.id, { onDelete: 'set null' }),
  homeworkId: uuid('homework_id'),
  contestId: uuid('contest_id'),
  name: varchar('name', { length: 255 }).notNull(),
  isDraft: boolean('is_draft').default(true).notNull(),
  lastAutoSave: timestamp('last_auto_save', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceFiles = pgTable('workspace_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => workspaceProjects.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  content: text('content').notNull(),
  isMain: boolean('is_main').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
