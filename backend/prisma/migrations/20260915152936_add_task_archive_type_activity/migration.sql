-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('TASK', 'BUG', 'FEATURE', 'CHORE', 'IMPROVEMENT', 'DOCUMENTATION');

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'CANNOT_REPRODUCE';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "type" "TaskType" NOT NULL DEFAULT 'TASK';

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: any existing task already marked Done becomes archived now, using its last
-- update time as the archive moment, matching the new rule that Done tasks are locked.
UPDATE "Task" SET "archivedAt" = "updatedAt" WHERE "status" = 'DONE' AND "archivedAt" IS NULL;

-- Backfill: give every existing task a starting activity log entry so the log has
-- continuity, plus a status entry for ones that were already Done. The real person who
-- moved those historical ones to Done wasn't tracked before this migration, so this is
-- attributed to the task's creator as a best-effort record.
INSERT INTO "TaskActivity" ("id", "taskId", "userId", "action", "details", "createdAt")
SELECT gen_random_uuid()::text, "id", "creatorId", 'created', 'Task created', "createdAt"
FROM "Task";

INSERT INTO "TaskActivity" ("id", "taskId", "userId", "action", "details", "createdAt")
SELECT gen_random_uuid()::text, "id", "creatorId",
       'status_changed',
       'Status recorded as Done (history before this update was not tracked) — archived',
       "updatedAt"
FROM "Task"
WHERE "status" = 'DONE';
