"use client";

import React, { useEffect, useRef, useState } from "react";
import { LogOut, Plus, Save, Search, Shield, Map } from "lucide-react";
import LoginForm from "../components/LoginForm";
import LeadCreator, { type LeadDraft } from "../components/LeadCreator";
import LeadDetails from "../components/LeadDetails";
import LeadTable from "../components/LeadTable";
import SearchPanel, { type SearchDraft } from "../components/SearchPanel";
import LeadMap from "../components/LeadMap";
import { useAuthProfile } from "../hooks/useAuthProfile";
import { useLeadData } from "../hooks/useLeadData";
import { formatDateTime } from "../lib/leadUtils";

function defaultLeadDraft(): LeadDraft {
  return {
    fullName: "",
    phone: "",
    email: "",
    utilityBill: "no",
    appointment: "no",
    noFollowUp: false,
    reminderDate: "",
    addressInput: "",
    verifiedAddress: null,
  };
}

function defaultSearchDraft(): SearchDraft {
  return {
    type: "specific",
    text: "",
    geoAddressInput: "",
    geoVerifiedAddress: null,
    radiusMiles: 1,
    chronologicalPreset: "today",
    dateStart: "",
    dateEnd: "",
  };
}

export default function QuickDoorLeadsPage() {
  const auth = useAuthProfile();

  const [leadDraft, setLeadDraft] = useState<LeadDraft>(defaultLeadDraft());
  const [searchDraft, setSearchDraft] = useState<SearchDraft>(defaultSearchDraft());
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [contactMade, setContactMade] = useState("yes");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [autosaveAt, setAutosaveAt] = useState<string | null>(null);
  const autosaveRef = useRef("");

  const leadData = useLeadData({
    sessionUserId: auth.sessionUserId,
    role: auth.profile?.role,
    searchDraft,
    page,
    setPage,
  });

  useEffect(() => {
    const raw = localStorage.getItem("quick-door-leads-draft");
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      if (saved.leadDraft) setLeadDraft(saved.leadDraft);
      if (saved.searchDraft) setSearchDraft(saved.searchDraft);
      if (saved.page) setPage(saved.page);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const snapshot = JSON.stringify({ leadDraft, searchDraft, page });
      if (snapshot !== autosaveRef.current) {
        localStorage.setItem("quick-door-leads-draft", snapshot);
        autosaveRef.current = snapshot;
        setAutosaveAt(new Date().toISOString());
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [leadDraft, searchDraft, page]);

  async function handleCreateLead() {
    const ok = await leadData.createLead(leadDraft);
    if (ok) {
      setLeadDraft(defaultLeadDraft());
      setShowCreate(false);
    }
  }

  if (auth.authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!auth.sessionUserId) {
    return (
      <LoginForm
        email={auth.email}
        setEmail={auth.setEmail}
        password={auth.password}
        setPassword={auth.setPassword}
        authError={auth.authError}
        onSignIn={auth.signIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-3xl font-bold">QUICK</div>
              <div className="text-slate-300">
                {auth.profile?.role === "master_admin" ? "Admin" : "Rep"} · {auth.email}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowSearch((v) => !v)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 font-semibold text-slate-900"
              >
                <Search className="h-4 w-4" />
                {showSearch ? "HIDE SEARCH" : "SEARCH"}
              </button>

              <button
                onClick={() => setShowMap((v) => !v)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 font-semibold text-slate-900"
              >
                <Map className="h-4 w-4" />
                {showMap ? "HIDE MAP" : "MAP"}
              </button>

              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-semibold text-slate-900"
              >
                <Plus className="h-4 w-4" />
                ADD NEW LEAD
              </button>

              {auth.profile?.role === "master_admin" && (
                <a
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 font-semibold text-slate-900"
                >
                  <Shield className="h-4 w-4" />
                  ADMIN
                </a>
              )}

              <button
                onClick={auth.signOut}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white"
              >
                <LogOut className="h-4 w-4" />
                SIGN OUT
              </button>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
            <Save className="h-3 w-3" />
            Autosaved every 3 seconds
            {autosaveAt ? ` · last saved ${formatDateTime(autosaveAt)}` : ""}
          </div>

          <div className="mt-2 text-xs text-slate-300">
            {leadData.loadingLeads
              ? "Loading Supabase leads..."
              : leadData.dbError
              ? leadData.dbError
              : `${leadData.leads.length} permanent lead(s) loaded from Supabase`}
          </div>
        </div>

        {showCreate && (
          <LeadCreator
            leadDraft={leadDraft}
            setLeadDraft={setLeadDraft}
            onCreateLead={handleCreateLead}
          />
        )}

        {showSearch && (
          <SearchPanel
            searchDraft={searchDraft}
            setSearchDraft={setSearchDraft}
          />
        )}

        {showMap && (
          <LeadMap
            leads={leadData.filtered.map((lead) => ({
              id: lead.id,
              fullName: lead.fullName,
              address: lead.address,
              lat: lead.lat,
              lon: lead.lon,
              createdAt: lead.createdAt,
            }))}
          />
        )}

        <LeadTable
          leads={leadData.paged.map((lead) => ({
            id: lead.id,
            fullName: lead.fullName,
            createdAt: lead.createdAt,
          }))}
          currentPage={leadData.currentPage}
          totalPages={leadData.totalPages}
          onSelectLead={leadData.setSelectedLeadId}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() =>
            setPage((p) => Math.min(leadData.totalPages, p + 1))
          }
        />

        <LeadDetails
          lead={
            leadData.selectedLead
              ? {
                  id: leadData.selectedLead.id,
                  fullName: leadData.selectedLead.fullName,
                  address: leadData.selectedLead.address,
                  mapsUrl: leadData.selectedLead.mapsUrl,
                  reminderDate: leadData.selectedLead.reminderDate,
                  contactLog: leadData.selectedLead.contactLog,
                  notes: leadData.selectedLead.notes,
                }
              : null
          }
          noteText={noteText}
          setNoteText={setNoteText}
          contactMade={contactMade}
          setContactMade={setContactMade}
          newReminderDate={newReminderDate}
          setNewReminderDate={setNewReminderDate}
          onClose={() => leadData.setSelectedLeadId(null)}
          onSaveReminder={() => {
            if (!leadData.selectedLead) return;

            leadData.updateLead({
              ...leadData.selectedLead,
              noFollowUp: false,
              reminderDate:
                newReminderDate || leadData.selectedLead.reminderDate,
              reminderStatus: "scheduled",
            });
          }}
          onContactAgain={() => {
            if (!leadData.selectedLead) return;
            leadData.addContactLog(leadData.selectedLead, contactMade);
          }}
          onAddNote={() => {
            if (!leadData.selectedLead) return;

            leadData.addNote(
              leadData.selectedLead,
              noteText,
              () => setNoteText("")
            );
          }}
          onDeleteLead={() => {
            if (!leadData.selectedLead) return;
            leadData.deleteLead(leadData.selectedLead.id);
          }}
        />
      </div>
    </div>
  );
}
