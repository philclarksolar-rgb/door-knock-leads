"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadDraft } from "../components/LeadCreator";
import type { SearchDraft } from "../components/SearchPanel";
import type { Lead } from "../lib/leadUtils";
import { useLeadFilters } from "./useLeadFilters";
import { loadLeadBundle } from "../lib/leadLoad";
import {
  addContactLogRecord,
  addNoteRecord,
  createLeadRecord,
  deleteLeadRecord,
  updateLeadRecord,
} from "../lib/leadMutations";

export function useLeadData({
  sessionUserId,
  role,
  profileName,
  searchDraft,
  page,
  setPage,
}: {
  sessionUserId: string | null;
  role?: string | null;
  profileName?: string | null;
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
      try {
        setLoadingLeads(true);
        const bundle = await loadLeadBundle({ sessionUserId, role });
        setLeads(bundle);
        setDbError("");
      } catch (err: any) {
        setDbError(err?.message || "Could not load database.");
      } finally {
        setLoadingLeads(false);
      }
    }

    loadAll();
  }, [sessionUserId, role]);

  const { filtered, paged, totalPages, currentPage } = useLeadFilters({
    leads,
    searchDraft,
    page,
  });

  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  async function createLead(leadDraft: LeadDraft) {
    try {
      const savedLead = await createLeadRecord({
        leadDraft,
        sessionUserId,
        creatorName: profileName || "Unknown",
      });

      if (!savedLead) return false;

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
    try {
      if (!sessionUserId) {
        throw new Error("You must be signed in.");
      }

      const updated = await updateLeadRecord(next, sessionUserId);

      setLeads((prev) =>
        prev.map((lead) => (lead.id === next.id ? updated : lead))
      );

      setDbError("");
    } catch (err: any) {
      setDbError(err?.message || "Could not update lead.");
    }
  }

  async function markClosedDeal(id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    await updateLead({
      ...lead,
      isClosed: true,
      isCancelled: false,
      statusLastChangedAt: new Date().toISOString(),
    });
  }

  async function markCancelledDeal(id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    await updateLead({
      ...lead,
      isClosed: false,
      isCancelled: true,
      reminderDate: "",
      noFollowUp: true,
      reminderStatus: "none",
      statusLastChangedAt: new Date().toISOString(),
    });
  }

  async function reviveDeal(id: string, reminderDate: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || !reminderDate) return;

    await updateLead({
      ...lead,
      isClosed: false,
      isCancelled: false,
      noFollowUp: false,
      reminderDate,
      reminderStatus: "scheduled",
      statusLastChangedAt: new Date().toISOString(),
    });
  }

  async function deleteLead(id: string) {
    try {
      await deleteLeadRecord(id);

      setLeads((prev) => prev.filter((lead) => lead.id !== id));
      if (selectedLeadId === id) setSelectedLeadId(null);
      setDbError("");
    } catch (err: any) {
      setDbError(err?.message || "Could not delete lead.");
    }
  }

  async function addContactLog(lead: Lead, contactMade: string) {
    try {
      const entry = await addContactLogRecord({
        lead,
        contactMade,
        sessionUserId,
      });

      await updateLead({
        ...lead,
        contactLog: [...lead.contactLog, entry],
      });
    } catch (err: any) {
      setDbError(err?.message || "Could not save contact log.");
    }
  }

  async function addNote(lead: Lead, noteText: string, clear: () => void) {
    try {
      const entry = await addNoteRecord({
        lead,
        noteText,
        sessionUserId,
      });

      if (!entry) return;

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
    markCancelledDeal,
    reviveDeal,
    deleteLead,
    addContactLog,
    addNote,
  };
}
