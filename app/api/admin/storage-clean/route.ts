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

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();

    const bucketsToClean = ["roof-photos", "panel-photos"];

    const results: any[] = [];

    for (const bucket of bucketsToClean) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list("", { limit: 1000 });

      if (listError) {
        results.push({ bucket, error: listError.message });
        continue;
      }

      const paths = (files || []).map((f: any) => f.name).filter(Boolean);

      if (paths.length === 0) {
        results.push({ bucket, removed: 0 });
        continue;
      }

      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (removeError) {
        results.push({ bucket, error: removeError.message });
      } else {
        results.push({ bucket, removed: paths.length });
      }
    }

    return NextResponse.json({
      cleaned: true,
      results,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "storage-clean failed" },
      { status: 500 }
    );
  }
}
