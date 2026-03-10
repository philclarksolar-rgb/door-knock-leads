export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data, error } = await supabase.storage.emptyBucket("attachments");

    if (error) throw error;

    return NextResponse.json({
      cleaned: true,
      result: data,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "storage-clean failed" },
      { status: 500 }
    );
  }
}
