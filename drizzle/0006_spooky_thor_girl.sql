ALTER TABLE "question_bank" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;