"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadDraft } from "../components/LeadCreator";
import type { SearchDraft } from "../components/SearchPanel";
import {
  getChronologicalRange,
  haversineMiles,
  mapLeadToRow,
  mapRowToLead,
  normalizeText,
  type ContactEntry,
  type Lead,
  type NoteEntry,
  uid,
} from "../lib/leadUtils";

const REMINDER_EMAIL = "philclarksolar@gmail.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PAGE_SIZE = 30;

function supabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY || "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
    "Content-Type": "application/json",
  };
}

export function useLeadData({
  sessionUserId,
  role,
  searchDraft,
  page,
  setPage,
}: {
  sessionUserId: string | null;
  role?: string | null;
  searchDraft: SearchDraft;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    async function loadAll() {
      if (!sessionUserId) {
        setLeads([]);
        setLoadingLeads(false);
        return;
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setDbError("Missing Supabase environment variables.");
        setLoadingLeads(false);
        return;
      }

      try {
        setLoadingLeads(true);

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

        setLeads(Array.from(leadMap.values()));
        setDbError("");
      } catch (err: any) {
        setDbError(err?.message || "Could not load database.");
      } finally {
        setLoadingLeads(false);
      }
    }

    loadAll();
  }, [sessionUserId, role]);

  const filtered = useMemo(() => {
    let matched = leads;

    if (!searchDraft.includeClosedDeals) {
      matched = matched.filter((lead) => !lead.isClosed);
    }

    if (searchDraft.type === "specific") {
      const q = normalizeText(searchDraft.text);
      if (q) {
        matched = matched.filter((lead) =>
          [lead.fullName, lead.address, lead.phone, lead.email].some((field) =>
            normalizeText(field).includes(q)
          )
        );
      }
    }

    if (searchDraft.type === "geo") {
      const ref = searchDraft.geoVerifiedAddress;
      if (!ref) {
        matched = [];
      } else {
        matched = matched.filter(
          (lead) =>
            lead.lat != null &&
            lead.lon != null &&
            haversineMiles(ref.lat, ref.lon, lead.lat, lead.lon) <=
              Number(searchDraft.radiusMiles || 0) + 0.05
        );
      }
    }

    if (searchDraft.type === "chronological") {
      const { rangeStart, rangeEnd } = getChronologicalRange(
        searchDraft.chronologicalPreset,
        searchDraft.dateStart,
        searchDraft.dateEnd
      );
      matched = matched.filter((lead) => {
        const created = new Date(lead.createdAt);
        if (rangeStart && created < rangeStart) return false;
        if (rangeEnd && created > rangeEnd) return false;
        return true;
      });
    }

    return matched.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [leads, searchDraft]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  async function createLead(leadDraft: LeadDraft) {
    if (
      !leadDraft.fullName.trim() ||
      !leadDraft.phone.trim() ||
      !leadDraft.verifiedAddress ||
      (!leadDraft.noFollowUp && !leadDraft.reminderDate)
    ) {
      return false;
    }

    if (!sessionUserId) {
      setDbError("You must be signed in.");
      return false;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setDbError("Missing Supabase environment variables.");
      return false;
    }

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
      ownerUserId: sessionUserId,
      notes: [],
      contactLog: [],
    };

    try {
      const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(mapLeadToRow(draftLead, sessionUserId)),
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

      setLeads((prev) => [savedLead, ...prev]);
      setPage(1);
      setSelectedLeadId(savedLead.id);
      setDbError("");
      return true;
    } catch (err: any) {
      setDbError(err?.message || "Could not save lead.");
      return false;
    }
  }

  async function updateLead(next: Lead) {
    if (!sessionUserId) {
      setDbError("You must be signed in.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setDbError("Missing Supabase environment variables.");
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${next.id}`, {
        method: "PATCH",
        headers: {
          ...supabaseHeaders(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(mapLeadToRow(next, next.ownerUserId || sessionUserId)),
      });

      if (!res.ok) throw new Error("Could not update lead.");

      const rows = await res.json();
      const updated = mapRowToLead(rows[0]);
      updated.notes = next.notes;
      updated.contactLog = next.contactLog;

      setLeads((prev) => prev.map((lead) => (lead.id === next.id ? updated : lead)));
      setDbError("");
    } catch (err: any) {
      setDbError(err?.message || "Could not update lead.");
    }
  }

  async function markClosedDeal(id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    await updateLead({ ...lead, isClosed: true });
  }

  async function deleteLead(id: string) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setDbError("Missing Supabase environment variables.");
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
        method: "DELETE",
        headers: supabaseHeaders(),
      });

      if (!res.ok) throw new Error("Could not delete lead.");

      setLeads((prev) => prev.filter((lead) => lead.id !== id));
      if (selectedLeadId === id) setSelectedLeadId(null);
      setDbError("");
    } catch (err: any) {
      setDbError(err?.message || "Could not delete lead.");
    }
  }

  async function addContactLog(lead: Lead, contactMade: string) {
    if (!sessionUserId) {
      setDbError("You must be signed in.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setDbError("Missing Supabase environment variables.");
      return;
    }

    try {
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

      await updateLead({
        ...lead,
        contactLog: [...lead.contactLog, entry],
      });
    } catch (err: any) {
      setDbError(err?.message || "Could not save contact log.");
    }
  }

  async function addNote(lead: Lead, noteText: string, clear: () => void) {
    if (!noteText.trim()) return;

    if (!sessionUserId) {
      setDbError("You must be signed in.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setDbError("Missing Supabase environment variables.");
      return;
    }

    try {
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

      await updateLead({
        ...lead,
        notes: [...lead.notes, entry],
      });

      clear();
    } catch (err: any) {
      setDbError(err?.message || "Could not save note.");
    }
  }

  return {
    leads,
    setLeads,
    selectedLeadId,
    setSelectedLeadId,
    loadingLeads,
    dbError,
    filtered,
    totalPages,
    currentPage,
    paged,
    selectedLead,
    createLead,
    updateLead,
    markClosedDeal,
    deleteLead,
    addContactLog,
    addNote,
  };
}
