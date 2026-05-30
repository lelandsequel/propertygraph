import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PROPERTYGRAPH_SUPABASE_URL || process.env.SUPABASE_URL || "https://bkeixpzvoilaibnfkzvl.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.PROPERTYGRAPH_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "missing-supabase-key";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
