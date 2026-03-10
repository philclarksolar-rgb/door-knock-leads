import type { Lead, ContactEntry } from "../leadUtils";
import { ensureSupabaseEnv, getSupabaseUrl, supabaseHeaders } from "../supabaseRest";

export async function addContactLogRecord({
  lead,
  contactMade,
  sessionUserId,
}: {
  lead: Lead;
  contactMade: string;
  sessionUserId: string;
}) {

  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_log`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      lead_id: lead.id,
      label: "CONTACT AGAIN",
      contact_made: contactMade === "yes",
      owner_user_id: sessionUserId,
    }),
  });

  if (!res.ok) throw new Error("Could not save contact log.");

  const rows = await res.json();

  const entry: ContactEntry = {
    id: rows[0].id,
    label: rows[0].label,
    contactMade: !!rows[0].contact_made,
    at: rows[0].created_at,
    ownerUserId: rows[0].owner_user_id || null,
  };

  return entry;
}
