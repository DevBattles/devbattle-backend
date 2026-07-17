ALTER TABLE "question_bank" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "workspace_type" varchar(50);--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "evaluation_strategy" varchar(50);--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "supported_language" varchar(50);--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "preview_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "execution_mode" varchar(50);--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "options" jsonb;--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "workspace_type" varchar(50);--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "evaluation_strategy" varchar(50);--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "supported_language" varchar(50);--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "preview_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "execution_mode" varchar(50);--> statement-breakpoint
ALTER TABLE "question_versions" ADD COLUMN "options" jsonb;