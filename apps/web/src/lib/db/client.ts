import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    const url = process.env.PROPERTYGRAPH_SUPABASE_URL || process.env.SUPABASE_URL || "https://bkeixpzvoilaibnfkzvl.supabase.co";
    const key =
      process.env.PROPERTYGRAPH_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    _client = createClient<Database>(url, key);
  }
  return _client;
}

// Backward compat proxy — only initializes on first property access
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
