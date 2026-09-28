-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "billingAddress" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: add clientId as nullable first so we can backfill existing rows
ALTER TABLE "Project" ADD COLUMN "clientId" TEXT;

-- Backfill: every pre-existing Project gets its own new Client, named after the
-- project (stripping a trailing "'s Project" if present), owned by the project's owner.
DO $$
DECLARE
  proj RECORD;
  new_client_id TEXT;
BEGIN
  FOR proj IN SELECT "id", "name", "ownerId" FROM "Project" LOOP
    new_client_id := gen_random_uuid()::text;
    INSERT INTO "Client" ("id", "name", "creatorId", "createdAt", "updatedAt")
    VALUES (new_client_id, regexp_replace(proj."name", '''s Project$', ''), proj."ownerId", now(), now());
    UPDATE "Project" SET "clientId" = new_client_id WHERE "id" = proj."id";
  END LOOP;
END $$;

-- AlterTable: clientId is now populated for every row, make it required
ALTER TABLE "Project" ALTER COLUMN "clientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
