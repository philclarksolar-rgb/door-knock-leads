import type { LeadDraft } from "../../components/LeadCreator";
import { mapLeadToRow, mapRowToLead, uid, type Lead } from "../leadUtils";
import { ensureSupabaseEnv, getSupabaseUrl, supabaseHeaders } from "../supabaseRest";

const REMINDER_EMAIL = "philclarksolar@gmail.com";

export async function createLeadRecord({
  leadDraft,
  sessionUserId,
  creatorName,
}: {
  leadDraft: LeadDraft;
  sessionUserId: string | null;
  creatorName: string;
}) {

  if (
    !leadDraft.fullName.trim() ||
    !leadDraft.phone.trim() ||
    !leadDraft.verifiedAddress ||
    (!leadDraft.noFollowUp && !leadDraft.reminderDate)
  ) {
    return null;
  }

  if (!sessionUserId) throw new Error("You must be signed in.");

  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();
  const now = new Date().toISOString();

  const draftLead: Lead = {
    id: uid(),
    fullName: leadDraft.fullName.trim(),
    phone: leadDraft.phone.trim(),
    email: leadDraft.email.trim(),
    utilityBill: leadDraft.utilityBill,
    appointment: leadDraft.appointment,
    noFollowUp: leadDraft.noFollowUp,
    reminderDate: leadDraft.noFollowUp ? "" : leadDraft.reminderDate,
    reminderMode: "email",
    reminderStatus: leadDraft.noFollowUp ? "none" : "scheduled",
    reminderTarget: REMINDER_EMAIL,
    address: leadDraft.verifiedAddress.display_name,
    lat: leadDraft.verifiedAddress.lat,
    lon: leadDraft.verifiedAddress.lon,
    mapsUrl: leadDraft.verifiedAddress.mapsUrl,
    createdAt: now,
    updatedAt: now,
    isClosed: false,
    isCancelled: false,
    statusLastChangedAt: now,
    ownerUserId: sessionUserId,
    creatorName,
    notes: [],
    contactLog: [],
  };

  const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(mapLeadToRow(draftLead, sessionUserId)),
  });

  if (!leadRes.ok) throw new Error("Could not save lead.");

  const rows = await leadRes.json();
  return mapRowToLead(rows[0]);
}
