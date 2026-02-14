import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Untyped Supabase client for public-facing pages (booking, contact)
 * that don't operate within a specific workspace context.
 */
export function createPublicClient() {
  // During SSR / build prerender, skip creating the Supabase client
  if (typeof window === "undefined") return null as any;

  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
