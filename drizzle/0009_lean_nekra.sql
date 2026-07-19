ALTER TABLE "batches" ADD COLUMN "join_code" varchar(20);--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_join_code_unique" UNIQUE("join_code");