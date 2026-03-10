import { mapLeadToRow, mapRowToLead, type Lead } from "../leadUtils";
import { ensureSupabaseEnv, getSupabaseUrl, supabaseHeaders } from "../supabaseRest";

export async function updateLeadRecord(next: Lead, sessionUserId: string) {

  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${next.id}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(mapLeadToRow(next, sessionUserId)),
  });

  if (!res.ok) throw new Error("Could not update lead.");

  const rows = await res.json();
  const updated = mapRowToLead(rows[0]);

  updated.notes = next.notes;
  updated.contactLog = next.contactLog;

  return updated;
}
