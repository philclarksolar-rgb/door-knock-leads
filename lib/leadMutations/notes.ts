import type { Lead, NoteEntry } from "../leadUtils";
import { ensureSupabaseEnv, getSupabaseUrl, supabaseHeaders } from "../supabaseRest";

export async function addNoteRecord({
  lead,
  noteText,
  sessionUserId,
}: {
  lead: Lead;
  noteText: string;
  sessionUserId: string;
}) {

  if (!noteText.trim()) return null;

  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      lead_id: lead.id,
      note: noteText.trim(),
      owner_user_id: sessionUserId,
    }),
  });

  if (!res.ok) throw new Error("Could not save note.");

  const rows = await res.json();

  const entry: NoteEntry = {
    id: rows[0].id,
    text: rows[0].note,
    at: rows[0].created_at,
    ownerUserId: rows[0].owner_user_id || null,
  };

  return entry;
}
