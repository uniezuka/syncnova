-- Turn on Row-Level Security for every table in the public schema.
-- SyncNova only reaches the database through Prisma as the "postgres" role, which owns
-- these tables and has BYPASSRLS, so the app is not affected. With RLS on and no
-- policies, the Supabase Data API (anon / authenticated roles) can no longer read or
-- write any rows, which is what the Supabase security advisor asks for.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
