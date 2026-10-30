import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  "postgresql://postgres.axkhqktmixesmrafcrju:Shivam%40161189@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

// Always use prepare: false for compatibility with Supabase PgBouncer Transaction Pooler (port 6543)
export const sql =
  globalForDb.sql ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://axkhqktmixesmrafcrju.supabase.co";
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

