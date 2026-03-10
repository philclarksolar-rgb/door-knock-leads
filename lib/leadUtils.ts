const REMINDER_EMAIL = "philclarksolar@gmail.com";

export type LeadStatus =
  | "Cancelled Deal"
  | "Closed Deal"
  | "Followup Required"
  | "New Lead"
  | "Expiring Lead"
  | "Old Lead";

export type ContactEntry = {
  id: string;
  label: string;
  contactMade: boolean;
  at: string;
  ownerUserId?: string | null;
};

export type NoteEntry = {
  id: string;
  text: string;
  at: string;
  ownerUserId?: string | null;
};

export type Lead = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  utilityBill: string;
  appointment: string;
  noFollowUp: boolean;
  reminderDate: string;
  reminderMode: string;
  reminderStatus: string;
  reminderTarget: string;
  address: string;
  lat: number | null;
  lon: number | null;
  mapsUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isClosed: boolean;
  isCancelled: boolean;
  roofPhotoPath?: string | null;
  panelPhotoPath?: string | null;
  utilityBillPath?: string | null;
  statusLastChangedAt?: string | null;
  ownerUserId?: string | null;
  createdByUserId?: string | null;
  creatorName?: string | null;
  notes: NoteEntry[];
  contactLog: ContactEntry[];
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function toDateInputValue(d?: Date | string | null) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function normalizeText(v?: string | null) {
  return (v || "").toLowerCase().trim();
}

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type ChronologicalPreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "custom";

export function getChronologicalRange(
  preset: ChronologicalPreset,
  start: string,
  end: string
) {
  const now = new Date();
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  if (preset === "today") {
    rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (preset === "yesterday") {
    rangeStart = new Date(now);
    rangeStart.setDate(now.getDate() - 1);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (preset === "thisWeek") {
    rangeStart = new Date(now);
    const day = rangeStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    rangeStart.setDate(rangeStart.getDate() - diff);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (preset === "thisMonth") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);
  } else {
    rangeStart = start ? new Date(`${start}T00:00:00`) : null;
    rangeEnd = end ? new Date(`${end}T23:59:59`) : null;
  }

  return { rangeStart, rangeEnd };
}

export function computeLeadStatus(lead: Lead): LeadStatus {
  if (lead.isCancelled) return "Cancelled Deal";
  if (lead.isClosed) return "Closed Deal";
  if (lead.reminderDate) return "Followup Required";

  const created = new Date(lead.createdAt);
  const now = new Date();
  const ageMs = now.getTime() - created.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays < 7) return "New Lead";
  if (ageDays < 14) return "Expiring Lead";
  return "Old Lead";
}

export function statusFilterOptions(): LeadStatus[] {
  return [
    "Cancelled Deal",
    "Closed Deal",
    "Followup Required",
    "New Lead",
    "Expiring Lead",
    "Old Lead",
  ];
}

export function mapRowToLead(row: any): Lead {
  return {
    id: row.id,
    fullName: row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    utilityBill: row.utility_bill || "no",
    appointment: row.appointment || "no",
    noFollowUp: !row.reminder_date,
    reminderDate: row.reminder_date || "",
    reminderMode: row.reminder_mode || "email",
    reminderStatus:
      row.reminder_status || (row.reminder_date ? "scheduled" : "none"),
    reminderTarget: row.reminder_target || REMINDER_EMAIL,
    address: row.address || "",
    lat: row.lat ?? null,
    lon: row.lon ?? null,
    mapsUrl: row.maps_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isClosed: !!row.is_closed,
    isCancelled: !!row.is_cancelled,
    roofPhotoPath: row.roof_photo_path || null,
    panelPhotoPath: row.panel_photo_path || null,
    utilityBillPath: row.utility_bill_path || null,
    statusLastChangedAt: row.status_last_changed_at || null,
    ownerUserId: row.owner_user_id || null,
    createdByUserId: row.created_by_user_id || null,
    creatorName: row.created_by_name || null,
    notes: [],
    contactLog: [],
  };
}

export function mapLeadToRow(lead: Lead, ownerUserId: string) {
  return {
    full_name: lead.fullName,
    phone: lead.phone,
    email: lead.email || null,
    utility_bill: lead.utilityBill,
    appointment: lead.appointment,
    address: lead.address,
    lat: lead.lat,
    lon: lead.lon,
    maps_url: lead.mapsUrl,
    reminder_date: lead.noFollowUp ? null : lead.reminderDate || null,
    reminder_mode: lead.reminderMode,
    reminder_status: lead.noFollowUp ? "none" : lead.reminderStatus,
    reminder_target: lead.reminderTarget,
    is_closed: lead.isClosed,
    is_cancelled: lead.isCancelled,
    roof_photo_path: lead.roofPhotoPath || null,
    panel_photo_path: lead.panelPhotoPath || null,
    utility_bill_path: lead.utilityBillPath || null,
    status_last_changed_at: lead.statusLastChangedAt || null,
    owner_user_id: ownerUserId,
    created_by_user_id: lead.createdByUserId || ownerUserId,
    created_by_name: lead.creatorName || null,
    updated_at: new Date().toISOString(),
  };
}
