DO $$
BEGIN
  IF to_regclass('public.extension_tokens') IS NULL THEN
    RAISE EXCEPTION 'extension_tokens table is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'extension_tokens'
      AND indexname = 'extension_tokens_token_hash_key'
  ) THEN
    RAISE EXCEPTION 'extension token uniqueness index is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'extension_tokens'
      AND constraint_name = 'extension_tokens_user_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'extension token ownership foreign key is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'items'
      AND column_name = 'processing_stage'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'items'
      AND column_name = 'processing_error'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'items'
      AND column_name = 'processing_attempt'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'items'
      AND column_name = 'podcast_name'
  ) THEN
    RAISE EXCEPTION 'current item processing or metadata columns are missing';
  END IF;
END
$$;
