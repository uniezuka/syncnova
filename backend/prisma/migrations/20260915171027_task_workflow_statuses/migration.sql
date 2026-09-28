-- Replace TaskStatus's value set: drop CANNOT_REPRODUCE, add FOR_REVIEW and REJECTED.
-- Postgres has no direct "remove enum value" operation, so the standard approach is to
-- create a new type with the desired values, move the column over, then swap it in.
-- Safe here: no existing row uses CANNOT_REPRODUCE (verified before writing this).

CREATE TYPE "TaskStatus_new" AS ENUM ('TODO', 'IN_PROGRESS', 'FOR_REVIEW', 'REJECTED', 'DONE');

ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';

DROP TYPE "TaskStatus";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
