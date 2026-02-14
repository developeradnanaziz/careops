import { createBrowserClient } from "@supabase/ssr";

/**
 * Untyped Supabase client for public-facing pages (booking, contact)
 * that don't operate within a specific workspace context.
 */
export function createPublicClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
  );
}
