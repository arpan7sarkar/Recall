# Prisma Migration Runbook

The Prisma schema and the checked-in migration directories are the source of truth for database structure.

Do not use `prisma db push` against a shared, staging, or production database.

## Clean database verification

Set `DATABASE_URL` to an empty PostgreSQL database and install the API dependencies.

Run `npm run prisma:generate` from the repository root.

Run `npm --prefix apps/api exec prisma validate -- --schema prisma/schema.prisma`.

Run `npm --prefix apps/api exec prisma migrate deploy -- --schema prisma/schema.prisma`.

Run `npm --prefix apps/api exec prisma migrate status -- --schema prisma/schema.prisma`.

The CI quality job runs these deploy and status commands against a fresh PostgreSQL 16 service.

## Existing database reconciliation

Take a verified database backup before inspecting or changing migration state.

Run `prisma migrate status` and `prisma db pull --print` with the production `DATABASE_URL` in a protected environment.

Do not print the database URL or copy the introspected schema into the repository without review.

If the live migration ledger contains the baseline and extension-token migrations, and the pipeline and metadata columns are absent, run `prisma migrate deploy`.

If the live schema already contains the pipeline and metadata columns but the corresponding migration rows are absent, compare the live column definitions with the checked-in SQL and obtain review before using `prisma migrate resolve --applied` for either migration.

Never mark a migration applied solely because a column has the expected name.

If a migration is partially applied or its live definition differs from the checked-in SQL, stop and restore or reconcile the database through a reviewed forward migration.

The current isolated environment has no reachable PostgreSQL service and cannot perform this protected read-only verification.

## Rollback and forward recovery

Prisma migrations in this repository are forward-only.

To roll back an unsafe release, restore the verified database backup and deploy the previously approved application revision.

For a live schema correction, create a new reviewed migration rather than editing an applied migration or deleting a migration ledger row.

Run `prisma migrate deploy` and `prisma migrate status` after the correction.

## Storage failure recovery

An upload is stored before its item row is created so the API attempts to delete the object when database persistence fails.

If deletion also fails, the API response includes the storage key needed for an operator-led cleanup.

Do not delete an object based only on a filename or URL; verify the scoped `uploads/{userId}/` key and the absence of a matching item first.

Durable storage keys and a complete orphan inventory remain deferred follow-up work in Session 06.
