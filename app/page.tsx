"use client";

import React, { useEffect, useRef, useState } from "react";
import LoginForm from "../components/LoginForm";
import HomeHeader from "../components/HomeHeader";
import HomePanels from "../components/HomePanels";
import { useAuthProfile } from "../hooks/useAuthProfile";
import { useLeadData } from "../hooks/useLeadData";
import type { LeadDraft } from "../components/LeadCreator";
import type { SearchDraft } from "../components/SearchPanel";

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
    includeClosedDeals: false,
    statusFilter: "all",
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
    profileName: auth.profile?.display_name,
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
        <HomeHeader
          role={auth.profile?.role}
          email={auth.email}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showMap={showMap}
          setShowMap={setShowMap}
          setShowCreate={setShowCreate}
          signOut={auth.signOut}
          autosaveAt={autosaveAt}
          loadingLeads={leadData.loadingLeads}
          dbError={leadData.dbError}
          leadCount={leadData.leads.length}
        />

        <HomePanels
          showCreate={showCreate}
          showSearch={showSearch}
          showMap={showMap}
          leadDraft={leadDraft}
          setLeadDraft={setLeadDraft}
          handleCreateLead={handleCreateLead}
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
          leadData={leadData}
          setPage={setPage}
          noteText={noteText}
          setNoteText={setNoteText}
          contactMade={contactMade}
          setContactMade={setContactMade}
          newReminderDate={newReminderDate}
          setNewReminderDate={setNewReminderDate}
        />
      </div>
    </div>
  );
}
