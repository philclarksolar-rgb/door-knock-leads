export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("supabaseKey is required.");
  }

  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage.listBuckets();

    if (error) throw error;

    return NextResponse.json({
      buckets: data,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "storage-status failed" },
      { status: 500 }
    );
  }
}
