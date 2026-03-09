import type { LeadDraft } from "../components/LeadCreator";
import {
  mapLeadToRow,
  mapRowToLead,
  uid,
  type ContactEntry,
  type Lead,
  type NoteEntry,
} from "./leadUtils";
import { ensureSupabaseEnv, getSupabaseUrl, supabaseHeaders } from "./supabaseRest";

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
    statusLastChangedAt: now,
    ownerUserId: sessionUserId,
    creatorName,
    notes: [],
    contactLog: [],
  };

  const row = mapLeadToRow(draftLead, sessionUserId);

  row.created_by_user_id = sessionUserId;
  row.created_by_name = creatorName;

  const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (!leadRes.ok) throw new Error("Could not save lead.");

  const leadRows = await leadRes.json();
  const savedLead = mapRowToLead(leadRows[0]);

  const contactRes = await fetch(`${SUPABASE_URL}/rest/v1/contact_log`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      lead_id: savedLead.id,
      label: "LEAD CREATION",
      contact_made: true,
      owner_user_id: sessionUserId,
    }),
  });

  if (!contactRes.ok) throw new Error("Lead saved, but contact log failed.");

  const contactRows = await contactRes.json();

  savedLead.contactLog = [
    {
      id: contactRows[0].id,
      label: contactRows[0].label,
      contactMade: !!contactRows[0].contact_made,
      at: contactRows[0].created_at,
      ownerUserId: contactRows[0].owner_user_id || null,
    },
  ];

  return savedLead;
}

export async function updateLeadRecord(next: Lead, fallbackOwnerUserId: string) {
  if (!fallbackOwnerUserId) throw new Error("You must be signed in.");

  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${next.id}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(mapLeadToRow(next, next.ownerUserId || fallbackOwnerUserId)),
  });

  if (!res.ok) throw new Error("Could not update lead.");

  const rows = await res.json();
  const updated = mapRowToLead(rows[0]);
  updated.notes = next.notes;
  updated.contactLog = next.contactLog;

  return updated;
}

export async function deleteLeadRecord(id: string) {
  ensureSupabaseEnv();
  const SUPABASE_URL = getSupabaseUrl();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method: "DELETE",
    headers: supabaseHeaders(),
  });

  if (!res.ok) throw new Error("Could not delete lead.");
}

export async function addContactLogRecord({
  lead,
  contactMade,
  sessionUserId,
}: {
  lead: Lead;
  contactMade: string;
  sessionUserId: string | null;
}) {
  if (!sessionUserId) throw new Error("You must be signed in.");

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

export async function addNoteRecord({
  lead,
  noteText,
  sessionUserId,
}: {
  lead: Lead;
  noteText: string;
  sessionUserId: string | null;
}) {
  if (!noteText.trim()) return null;
  if (!sessionUserId) throw new Error("You must be signed in.");

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
