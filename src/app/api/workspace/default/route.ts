import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/workspace/default
 *
 * Returns the first workspace in the system.
 * Used by the public booking page to scope contacts/bookings
 * to the correct workspace during the demo.
 *
 * Uses service-role key to bypass RLS (public users aren't authenticated).
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from("workspaces")
      .select("id, name")
      .limit(1)
      .single();

    if (!data) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    return NextResponse.json({ id: data.id, name: data.name });
  } catch {
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 });
  }
}
