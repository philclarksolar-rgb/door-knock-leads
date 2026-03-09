"use client";

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

      <FollowUpDashboard leads={leadData.leads} />

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
        onPrevPage={() => setPage((p: number) => Math.max(1, p - 1))}
        onNextPage={() =>
          setPage((p: number) => Math.min(leadData.totalPages, p + 1))
        }
      />

      <LeadDetails
        lead={
          leadData.selectedLead
            ? {
                ...leadData.selectedLead,
                phone: leadData.selectedLead.phone || "",
                isCancelled: leadData.selectedLead.isCancelled || false,
                createdAt: leadData.selectedLead.createdAt || "",
                roofPhotoPath: leadData.selectedLead.roofPhotoPath || null,
                panelPhotoPath: leadData.selectedLead.panelPhotoPath || null,
                utilityBillPath: leadData.selectedLead.utilityBillPath || null,
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
        onMarkClosedDeal={() => {
          if (!leadData.selectedLead) return;
          leadData.markClosedDeal(leadData.selectedLead.id);
        }}
        onMarkCancelledDeal={() => {
          if (!leadData.selectedLead) return;
          leadData.markCancelledDeal(leadData.selectedLead.id);
        }}
        onReviveDeal={() => {
          if (!leadData.selectedLead || !newReminderDate) {
            alert("Select a follow-up date first.");
            return;
          }
          leadData.reviveDeal(leadData.selectedLead.id, newReminderDate);
        }}
        onUpdateLead={(updates: any) => {
          if (!leadData.selectedLead) return;

          leadData.updateLead({
            ...leadData.selectedLead,
            ...updates,
          });
        }}
        onDeleteLead={() => {
          if (!leadData.selectedLead) return;

          const confirmed = confirm(
            `Delete lead "${
              leadData.selectedLead.fullName || "this lead"
            }"? This cannot be undone.`
          );

          if (!confirmed) return;

          leadData.deleteLead(leadData.selectedLead.id);
        }}
      />
    </>
  );
}
