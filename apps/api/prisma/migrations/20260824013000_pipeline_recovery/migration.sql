ALTER TABLE "items"
  ADD COLUMN "processing_stage" TEXT,
  ADD COLUMN "processing_error" TEXT,
  ADD COLUMN "processing_attempt" INTEGER NOT NULL DEFAULT 0;
