"use client";

import React from "react";
import LeadCreator from "./LeadCreator";
import LeadDetails from "./LeadDetails";
import LeadTable from "./LeadTable";
import LeadMap from "./LeadMap";
import SearchPanel from "./SearchPanel";
import FollowUpDashboard from "./FollowUpDashboard";

export default function HomePanels({
  showCreate,
  showSearch,
  showMap,
  leadDraft,
  setLeadDraft,
  handleCreateLead,
  searchDraft,
  setSearchDraft,
  leadData,
  setPage,
  noteText,
  setNoteText,
  contactMade,
  setContactMade,
  newReminderDate,
  setNewReminderDate,
  setShowCreate,
  sessionUserId,
  role,
}: any) {
  const selectedLead = leadData.selectedLead;

  function openCreateWithAddress(verifiedAddress: any) {
    setLeadDraft((prev: any) => ({
      ...prev,
      addressInput: verifiedAddress.display_name,
      verifiedAddress,
    }));

    setShowCreate(true);
  }

  return (
    <>
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
          leads={leadData.filtered}
          onOpenLead={(id: string) => leadData.setSelectedLeadId(id)}
          onPrefillLeadAddress={openCreateWithAddress}
          sessionUserId={sessionUserId}
          role={role}
        />
      )}

      <FollowUpDashboard
        leads={leadData.leads}
        onOpenLead={(id: string) => leadData.setSelectedLeadId(id)}
      />

      <LeadTable
        leads={leadData.paged}
        currentPage={leadData.currentPage}
        totalPages={leadData.totalPages}
        onSelectLead={leadData.setSelectedLeadId}
        onPrevPage={() => setPage((p: number) => Math.max(1, p - 1))}
        onNextPage={() =>
          setPage((p: number) => Math.min(leadData.totalPages, p + 1))
        }
      />

      <LeadDetails
        lead={selectedLead}
        noteText={noteText}
        setNoteText={setNoteText}
        contactMade={contactMade}
        setContactMade={setContactMade}
        newReminderDate={newReminderDate}
        setNewReminderDate={setNewReminderDate}
        onClose={() => leadData.setSelectedLeadId(null)}
        onSaveReminder={() => {
          if (!selectedLead) return;

          leadData.updateLead({
            ...selectedLead,
            noFollowUp: false,
            reminderDate:
              newReminderDate || selectedLead.reminderDate,
            reminderStatus: "scheduled",
          });
        }}
        onContactAgain={() => {
          if (!selectedLead) return;
          leadData.addContactLog(selectedLead, contactMade);
        }}
        onAddNote={() => {
          if (!selectedLead) return;
          leadData.addNote(selectedLead, noteText, () => setNoteText(""));
        }}
        onMarkClosedDeal={() => {
          if (!selectedLead) return;
          leadData.markClosedDeal(selectedLead.id);
        }}
        onMarkCancelledDeal={() => {
          if (!selectedLead) return;
          leadData.markCancelledDeal(selectedLead.id);
        }}
        onReviveDeal={() => {
          if (!selectedLead || !newReminderDate) {
            alert("Select a follow-up date first.");
            return;
          }

          leadData.reviveDeal(selectedLead.id, newReminderDate);
        }}
        onUpdateLead={(updates: any) => {
          if (!selectedLead) return;
          leadData.updateLead({
            ...selectedLead,
            ...updates,
          });
        }}
        onDeleteLead={() => {
          if (!selectedLead) return;

          const confirmed = confirm(
            `Delete lead "${
              selectedLead.fullName || "this lead"
            }"? This cannot be undone.`
          );

          if (!confirmed) return;

          leadData.deleteLead(selectedLead.id);
        }}
      />
    </>
  );
}
