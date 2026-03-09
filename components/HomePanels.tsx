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
}: any) {
  const selectedLead = leadData.selectedLead;

  return (
    <>
      {/* CREATE LEAD */}

      {showCreate && (
        <LeadCreator
          leadDraft={leadDraft}
          setLeadDraft={setLeadDraft}
          onCreateLead={handleCreateLead}
        />
      )}

      {/* SEARCH PANEL */}

      {showSearch && (
        <SearchPanel
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
        />
      )}

      {/* MAP */}

      {showMap && (
        <LeadMap
          leads={leadData.filtered.map((lead: any) => ({
            id: lead.id,
            fullName: lead.fullName,
            address: lead.address,
            lat: lead.lat,
            lon: lead.lon,
            createdAt: lead.createdAt,
          }))}
        />
      )}

      {/* FOLLOWUPS DASHBOARD */}

      <FollowUpDashboard
        leads={leadData.leads}
        onOpenLead={(id: string) =>
          leadData.setSelectedLeadId(id)
        }
      />

      {/* LEAD TABLE */}

      <LeadTable
        leads={leadData.paged.map((lead: any) => ({
          id: lead.id,
          fullName: lead.fullName,
          createdAt: lead.createdAt,
          isClosed: lead.isClosed,
        }))}
        currentPage={leadData.currentPage}
        totalPages={leadData.totalPages}
        onSelectLead={leadData.setSelectedLeadId}
        onPrevPage={() =>
          setPage((p: number) => Math.max(1, p - 1))
        }
        onNextPage={() =>
          setPage((p: number) =>
            Math.min(leadData.totalPages, p + 1)
          )
        }
      />

      {/* LEAD DETAILS */}

      <LeadDetails
        lead={
          selectedLead
            ? {
                ...selectedLead,
                phone: selectedLead.phone || "",
                isCancelled: selectedLead.isCancelled || false,
                createdAt: selectedLead.createdAt || "",
                roofPhotoPath: selectedLead.roofPhotoPath || null,
                panelPhotoPath: selectedLead.panelPhotoPath || null,
                utilityBillPath:
                  selectedLead.utilityBillPath || null,
              }
            : null
        }
        noteText={noteText}
        setNoteText={setNoteText}
        contactMade={contactMade}
        setContactMade={setContactMade}
        newReminderDate={newReminderDate}
        setNewReminderDate={setNewReminderDate}
        onClose={() =>
          leadData.setSelectedLeadId(null)
        }
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

          leadData.addContactLog(
            selectedLead,
            contactMade
          );
        }}
        onAddNote={() => {
          if (!selectedLead) return;

          leadData.addNote(
            selectedLead,
            noteText,
            () => setNoteText("")
          );
        }}
        onMarkClosedDeal={() => {
          if (!selectedLead) return;

          leadData.markClosedDeal(selectedLead.id);
        }}
        onMarkCancelledDeal={() => {
          if (!selectedLead) return;

          leadData.markCancelledDeal(
            selectedLead.id
          );
        }}
        onReviveDeal={() => {
          if (!selectedLead || !newReminderDate) {
            alert("Select a follow-up date first.");
            return;
          }

          leadData.reviveDeal(
            selectedLead.id,
            newReminderDate
          );
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
