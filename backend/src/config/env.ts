import "dotenv/config";
import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  // "*" allows any origin (fine for local dev). For a real deploy where the frontend
  // is hosted separately, set this to that origin (comma-separate for more than one).
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Only used when NODE_ENV=production: if this folder exists, the backend serves the
  // built frontend itself, so the whole app runs as a single process on one port.
  frontendDistPath: path.resolve(
    process.cwd(),
    process.env.FRONTEND_DIST_PATH ?? "../frontend/dist"
  ),
  // Where uploaded project files are stored. Each project gets its own subfolder here.
  uploadsDir: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "uploads"),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 25),
  // Optional. When SUPABASE_URL and SUPABASE_SERVICE_KEY are both set, uploaded files go
  // to this Supabase Storage bucket instead of uploadsDir (e.g. on hosts with no lasting disk).
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_BUCKET || "project-files",
};
