import type { Lead } from "./leadUtils";
import { mapRowToLead } from "./leadUtils";
import { ensureSupabaseEnv, getSupabaseUrl, supabaseHeaders } from "./supabaseRest";

export async function loadLeadBundle({
  sessionUserId,
  role,
}: {
  sessionUserId: string | null;
  role?: string | null;
}) {
  if (!sessionUserId) {
    return [];
  }

  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();

  const leadsFilter =
    role === "admin" || role === "master_admin"
      ? "select=*&order=created_at.desc"
      : `select=*&owner_user_id=eq.${sessionUserId}&order=created_at.desc`;

  const notesFilter =
    role === "admin" || role === "master_admin"
      ? "select=*&order=created_at.asc"
      : `select=*&owner_user_id=eq.${sessionUserId}&order=created_at.asc`;

  const contactFilter =
    role === "admin" || role === "master_admin"
      ? "select=*&order=created_at.asc"
      : `select=*&owner_user_id=eq.${sessionUserId}&order=created_at.asc`;

  const [leadsRes, notesRes, contactRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/leads?${leadsFilter}`, {
      headers: supabaseHeaders(),
      cache: "no-store",
    }),
    fetch(`${SUPABASE_URL}/rest/v1/notes?${notesFilter}`, {
      headers: supabaseHeaders(),
      cache: "no-store",
    }),
    fetch(`${SUPABASE_URL}/rest/v1/contact_log?${contactFilter}`, {
      headers: supabaseHeaders(),
      cache: "no-store",
    }),
  ]);

  if (!leadsRes.ok) throw new Error("Could not load leads.");
  if (!notesRes.ok) throw new Error("Could not load notes.");
  if (!contactRes.ok) throw new Error("Could not load contact log.");

  const leadRows = await leadsRes.json();
  const noteRows = await notesRes.json();
  const contactRows = await contactRes.json();

  const leadMap = new Map<string, Lead>();
  (leadRows || []).forEach((row: any) => {
    leadMap.set(row.id, mapRowToLead(row));
  });

  (noteRows || []).forEach((row: any) => {
    const lead = leadMap.get(row.lead_id);
    if (!lead) return;
    lead.notes.push({
      id: row.id,
      text: row.note || "",
      at: row.created_at,
      ownerUserId: row.owner_user_id || null,
    });
  });

  (contactRows || []).forEach((row: any) => {
    const lead = leadMap.get(row.lead_id);
    if (!lead) return;
    lead.contactLog.push({
      id: row.id,
      label: row.label || "",
      contactMade: !!row.contact_made,
      at: row.created_at,
      ownerUserId: row.owner_user_id || null,
    });
  });

  return Array.from(leadMap.values());
}
