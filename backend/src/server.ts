import { app } from "./app";
import { env } from "./config/env";
import { useSupabaseStorage } from "./modules/files/file.storage";

app.listen(env.port, () => {
  console.log(`SyncNova API listening on http://localhost:${env.port}`);
  console.log(
    useSupabaseStorage
      ? `File uploads: Supabase Storage (bucket "${env.supabaseBucket}")`
      : `File uploads: local folder ${env.uploadsDir}`
  );
});
