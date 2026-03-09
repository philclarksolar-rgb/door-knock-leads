// QUICK Door Leads — production repo bootstrap
// File: app/page.tsx
// This is the main UI file for the real app.
// Next step after this file: add the supporting repo files I list in chat.

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Bell, Clock, Trash2, Database, MapPin, Save, FileText, X, CheckCircle2, ExternalLink } from "lucide-react";

const PAGE_SIZE = 30;
const REMINDER_EMAIL = "philclarksolar@gmail.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type AddressOption = {
  id: string | number;
  display_name: string;
  lat: number;
  lon: number;
  mapsUrl: string;
};

type Lead = {
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
  notes: { id: string; text: string; at: string }[];
  contactLog: { id: string; label: string; contactMade: boolean; at: string }[];
};

type LeadDraft = {
  fullName: string;
  phone: string;
  email: string;
  utilityBill: string;
  appointment: string;
  noFollowUp: boolean;
  reminderDate: string;
  addressInput: string;
  verifiedAddress: AddressOption | null;
};

type SearchDraft = {
  type: "specific" | "geo" | "chronological";
  text: string;
  geoAddressInput: string;
  geoVerifiedAddress: AddressOption | null;
  radiusMiles: number;
  chronologicalPreset: "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom";
  dateStart: string;
  dateEnd: string;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY || "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
    "Content-Type": "application/json",
  };
}

function mapRowToLead(row: any): Lead {
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
    reminderStatus: row.reminder_status || (row.reminder_date ? "scheduled" : "none"),
    reminderTarget: row.reminder_target || REMINDER_EMAIL,
    address: row.address || "",
    lat: row.lat ?? null,
    lon: row.lon ?? null,
    mapsUrl: row.maps_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: [],
    contactLog: [],
  };
}

function mapLeadToRow(lead: Lead) {
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
    updated_at: new Date().toISOString(),
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function toDateInputValue(d?: Date | string | null) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function normalizeText(v?: string | null) {
  return (v || "").toLowerCase().trim();
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function getChronologicalRange(preset: SearchDraft["chronologicalPreset"], start: string, end: string) {
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

function useAddressAutocomplete(query: string, enabled = true) {
  const [results, setResults] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !query || query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query.trim())}`;
        const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("Address lookup failed.");
        const data = await res.json();
        setResults((data || []).map((item: any) => ({
          id: item.place_id,
          display_name: item.display_name,
          lat: Number(item.lat),
          lon: Number(item.lon),
          mapsUrl: `https://maps.google.com/?q=${item.lat},${item.lon}`,
        })));
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError("Could not load address matches.");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { results, loading, error };
}

function AddressAutocompleteField({ label, value, onValueChange, selected, onSelect, placeholder }: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  selected: AddressOption | null;
  onSelect: (v: AddressOption) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const { results, loading, error } = useAddressAutocomplete(value, true);

  useEffect(() => {
    setOpen(!!value && value.trim().length >= 3);
  }, [value]);

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => { onValueChange(e.target.value); setOpen(true); }} placeholder={placeholder} className="w-full rounded-2xl border px-3 py-2" />
      {selected ? <div className="rounded-2xl border bg-emerald-50 p-3 text-sm space-y-1"><div className="flex items-center gap-2 font-medium text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Verified Address</div><div>{selected.display_name}</div><div className="text-xs text-slate-500">Lat {selected.lat.toFixed(6)} · Lng {selected.lon.toFixed(6)}</div><a href={selected.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline"><ExternalLink className="w-3 h-3" /> Open in Maps</a></div> : null}
      {open && value.trim().length >= 3 ? <div className="absolute z-20 left-0 right-0 top-[72px] rounded-2xl border bg-white shadow-lg overflow-hidden">{loading ? <div className="p-3 text-sm text-slate-500">Finding matching addresses...</div> : null}{!loading && results.length === 0 && !error ? <div className="p-3 text-sm text-slate-500">No matches yet.</div> : null}{error ? <div className="p-3 text-sm text-red-500">{error}</div> : null}{!loading && results.map((item) => <button key={String(item.id)} onClick={() => { onValueChange(item.display_name); onSelect(item); setOpen(false); }} className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50 border-t first:border-t-0">{item.display_name}</button>)}</div> : null}
    </div>
  );
}

export default function QuickDoorLeadsPage() {
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(defaultLeadDraft());
  const [searchDraft, setSearchDraft] = useState<SearchDraft>(defaultSearchDraft());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [dbError, setDbError] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [contactMade, setContactMade] = useState("yes");
  const [newReminderDate, setNewReminderDate] = useState("");
  const autosaveRef = useRef("");
  const [autosaveAt, setAutosaveAt] = useState<string | null>(null);

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
    async function loadLeads() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setDbError("Missing Supabase environment variables.");
        setLoadingLeads(false);
        return;
      }
      try {
        setLoadingLeads(true);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
          headers: supabaseHeaders(),
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Could not load leads from Supabase.");
        const rows = await res.json();
        setLeads((rows || []).map(mapRowToLead));
        setDbError("");
      } catch (err: any) {
        setDbError(err?.message || "Could not load leads.");
      } finally {
        setLoadingLeads(false);
      }
    }
    loadLeads();
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

  const filtered = useMemo(() => {
    let matched = leads;
    if (searchDraft.type === "specific") {
      const q = normalizeText(searchDraft.text);
      if (q) matched = leads.filter((lead) => [lead.fullName, lead.address, lead.phone, lead.email].some((field) => normalizeText(field).includes(q)));
    }
    if (searchDraft.type === "geo") {
      const ref = searchDraft.geoVerifiedAddress;
      if (!ref) matched = [];
      else matched = leads.filter((lead) => lead.lat != null && lead.lon != null && haversineMiles(ref.lat, ref.lon, lead.lat, lead.lon) <= Number(searchDraft.radiusMiles || 0) + 0.05);
    }
    if (searchDraft.type === "chronological") {
      const { rangeStart, rangeEnd } = getChronologicalRange(searchDraft.chronologicalPreset, searchDraft.dateStart, searchDraft.dateEnd);
      matched = leads.filter((lead) => {
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

  async function createLead() {
    if (!leadDraft.fullName.trim() || !leadDraft.phone.trim() || !leadDraft.verifiedAddress || (!leadDraft.noFollowUp && !leadDraft.reminderDate)) return;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setDbError("Missing Supabase environment variables.");
      return;
    }
    const now = new Date().toISOString();
    const next: Lead = {
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
      notes: [],
      contactLog: [{ id: uid(), label: "LEAD CREATION", contactMade: true, at: now }],
    };
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(mapLeadToRow(next)),
      });
      if (!res.ok) throw new Error("Could not save lead to Supabase.");
      const rows = await res.json();
      const savedLead = mapRowToLead(rows[0]);
      setLeads((prev) => [savedLead, ...prev]);
      setLeadDraft(defaultLeadDraft());
      setPage(1);
      setSelectedLeadId(savedLead.id);
      setShowCreate(false);
      setDbError("");
    } catch (err: any) {
      setDbError(err?.message || "Could not save lead.");
    }
  }

  async function updateLead(next: Lead) {
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
        body: JSON.stringify(mapLeadToRow(next)),
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-3xl font-bold">QUICK</div><div className="text-slate-300">Real app repo build in progress</div></div><div className="flex flex-wrap gap-3">
              <button onClick={() => setShowSearch((v) => !v)} className="rounded-2xl bg-slate-200 px-4 py-2 text-slate-900 font-semibold inline-flex items-center gap-2"><Search className="w-4 h-4" /> {showSearch ? "HIDE SEARCH" : "SEARCH"}</button>
              <button onClick={() => setShowCreate(true)} className="rounded-2xl bg-white px-4 py-2 text-slate-900 font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> ADD NEW LEAD</button>
            </div></div>
          <div className="mt-3 text-xs text-slate-300 inline-flex items-center gap-2"><Save className="w-3 h-3" /> Autosaved every 3 seconds {autosaveAt ? `· last saved ${formatDateTime(autosaveAt)}` : ""}</div>
          <div className="mt-2 text-xs text-slate-300">{loadingLeads ? "Loading Supabase leads..." : dbError ? dbError : `${leads.length} permanent lead(s) loaded from Supabase`}</div>
        </div>

        {showCreate ? <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4"><div className="font-semibold text-lg">Create Lead</div><AddressAutocompleteField label="Address *" value={leadDraft.addressInput} onValueChange={(v) => setLeadDraft((p) => ({ ...p, addressInput: v, verifiedAddress: p.verifiedAddress?.display_name === v ? p.verifiedAddress : null }))} selected={leadDraft.verifiedAddress} onSelect={(item) => setLeadDraft((p) => ({ ...p, addressInput: item.display_name, verifiedAddress: item }))} placeholder="Start typing the address" /><div className="grid md:grid-cols-2 gap-4"><div><label className="text-sm font-medium">Full Name *</label><input value={leadDraft.fullName} onChange={(e) => setLeadDraft((p) => ({ ...p, fullName: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div><div><label className="text-sm font-medium">Phone *</label><input value={leadDraft.phone} onChange={(e) => setLeadDraft((p) => ({ ...p, phone: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div><div className="md:col-span-2"><label className="text-sm font-medium">Email</label><input value={leadDraft.email} onChange={(e) => setLeadDraft((p) => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div><div><label className="text-sm font-medium">Utility Bill?</label><select value={leadDraft.utilityBill} onChange={(e) => setLeadDraft((p) => ({ ...p, utilityBill: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></div><div><label className="text-sm font-medium">Appointment?</label><select value={leadDraft.appointment} onChange={(e) => setLeadDraft((p) => ({ ...p, appointment: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></div></div><div className="rounded-2xl bg-slate-50 p-4 space-y-3"><div className="font-medium inline-flex items-center gap-2"><Bell className="w-4 h-4" /> Reminder</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={leadDraft.noFollowUp} onChange={(e) => setLeadDraft((p) => ({ ...p, noFollowUp: e.target.checked, reminderDate: e.target.checked ? "" : p.reminderDate }))} /> NO FOLLOW-UP</label>{!leadDraft.noFollowUp ? <div><label className="text-sm font-medium">Reminder Date *</label><input type="date" value={leadDraft.reminderDate} onChange={(e) => setLeadDraft((p) => ({ ...p, reminderDate: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div> : null}</div><div className="flex justify-end"><button onClick={createLead} className="rounded-2xl bg-slate-900 px-4 py-2 text-white font-semibold">Create Lead</button></div></div> : null}

        {showSearch ? <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4"><div className="font-semibold text-lg inline-flex items-center gap-2"><Search className="w-5 h-5" /> Search</div><div><label className="text-sm font-medium">Search Type</label><select value={searchDraft.type} onChange={(e) => setSearchDraft((p) => ({ ...p, type: e.target.value as any }))} className="mt-1 w-full rounded-2xl border px-3 py-2"><option value="specific">Find a Specific Lead</option><option value="geo">Geographical Search</option><option value="chronological">Chronological Search</option></select></div>{searchDraft.type === "specific" ? <div><label className="text-sm font-medium">Name / Address / Phone / Email</label><input value={searchDraft.text} onChange={(e) => setSearchDraft((p) => ({ ...p, text: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div> : null}{searchDraft.type === "geo" ? <><AddressAutocompleteField label="Reference address" value={searchDraft.geoAddressInput} onValueChange={(v) => setSearchDraft((p) => ({ ...p, geoAddressInput: v, geoVerifiedAddress: p.geoVerifiedAddress?.display_name === v ? p.geoVerifiedAddress : null }))} selected={searchDraft.geoVerifiedAddress} onSelect={(item) => setSearchDraft((p) => ({ ...p, geoAddressInput: item.display_name, geoVerifiedAddress: item }))} placeholder="Enter address for radius search" /><div><label className="text-sm font-medium">Radius (0-50 miles)</label><input type="number" min="0" max="50" value={searchDraft.radiusMiles} onChange={(e) => setSearchDraft((p) => ({ ...p, radiusMiles: Math.max(0, Math.min(50, Number(e.target.value || 0))) }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div></> : null}{searchDraft.type === "chronological" ? <><div><label className="text-sm font-medium">Time Range</label><select value={searchDraft.chronologicalPreset} onChange={(e) => setSearchDraft((p) => ({ ...p, chronologicalPreset: e.target.value as any }))} className="mt-1 w-full rounded-2xl border px-3 py-2"><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="thisWeek">This Week</option><option value="thisMonth">This Month</option><option value="custom">Custom</option></select></div>{searchDraft.chronologicalPreset === "custom" ? <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">Start</label><input type="date" max={toDateInputValue(new Date())} value={searchDraft.dateStart} onChange={(e) => setSearchDraft((p) => ({ ...p, dateStart: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div><div><label className="text-sm font-medium">End</label><input type="date" max={toDateInputValue(new Date())} value={searchDraft.dateEnd} onChange={(e) => setSearchDraft((p) => ({ ...p, dateEnd: e.target.value }))} className="mt-1 w-full rounded-2xl border px-3 py-2" /></div></div> : null}</> : null}</div> : null}

        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-4"><div className="font-semibold text-lg inline-flex items-center gap-2"><Database className="w-5 h-5" /> Lead Database</div><div className="text-sm text-slate-500">{filtered.length} result(s)</div></div>
          <div className="grid grid-cols-[1.8fr_1fr] gap-3 px-3 py-3 border-b bg-slate-50 text-xs font-medium uppercase text-slate-500"><div>Name</div><div>Created</div></div>
          {paged.map((lead) => <button key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="grid w-full text-left grid-cols-[1.8fr_1fr] gap-3 items-center px-3 py-3 border-b hover:bg-slate-50 text-sm"><div className="font-medium truncate">{lead.fullName || "—"}</div><div className="text-slate-500">{formatDate(lead.createdAt)}</div></button>)}
          <div className="flex items-center justify-between px-4 py-4"><div className="text-sm text-slate-500">Page {currentPage} of {totalPages}</div><div className="flex gap-2"><button disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-50">Prev</button><button disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-50">Next</button></div></div>
        </div>

        {selectedLead ? <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4"><div className="flex items-center justify-between"><div className="font-semibold text-lg">{selectedLead.fullName}</div><button onClick={() => setSelectedLeadId(null)} className="rounded-full p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button></div><div className="rounded-2xl border p-4"><div className="font-medium inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</div><div className="mt-1">{selectedLead.address}</div>{selectedLead.mapsUrl ? <a href={selectedLead.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm underline"><ExternalLink className="w-3 h-3" /> Open in Maps</a> : null}</div><div className="rounded-2xl border p-4 space-y-3"><div className="font-medium inline-flex items-center gap-2"><Bell className="w-4 h-4" /> ADD REMINDER</div><input type="date" value={newReminderDate || selectedLead.reminderDate} onChange={(e) => setNewReminderDate(e.target.value)} className="w-full rounded-2xl border px-3 py-2" /><button onClick={() => updateLead({ ...selectedLead, noFollowUp: false, reminderDate: newReminderDate || selectedLead.reminderDate, reminderStatus: "scheduled" })} className="rounded-2xl bg-slate-900 px-4 py-2 text-white">Save Reminder</button></div><div className="rounded-2xl border p-4 space-y-3"><div className="font-medium inline-flex items-center gap-2"><Clock className="w-4 h-4" /> Contact Log</div><div className="flex gap-3 items-end"><div><label className="text-sm font-medium">Contact Made?</label><select value={contactMade} onChange={(e) => setContactMade(e.target.value)} className="mt-1 rounded-2xl border px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></div><button onClick={() => updateLead({ ...selectedLead, contactLog: [...selectedLead.contactLog, { id: uid(), label: "CONTACT AGAIN", contactMade: contactMade === "yes", at: new Date().toISOString() }] })} className="rounded-2xl bg-slate-900 px-4 py-2 text-white">Contact Again</button></div></div><div className="rounded-2xl border p-4 space-y-3"><div className="font-medium inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</div><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full min-h-[120px] rounded-2xl border px-3 py-2" placeholder="Type note here" /><div className="flex justify-end"><button onClick={() => { if (!noteText.trim()) return; updateLead({ ...selectedLead, notes: [...selectedLead.notes, { id: uid(), text: noteText.trim(), at: new Date().toISOString() }] }); setNoteText(""); }} className="rounded-2xl bg-slate-900 px-4 py-2 text-white">Add Note</button></div></div><div className="flex justify-between"><button onClick={() => deleteLead(selectedLead.id)} className="rounded-2xl bg-red-600 px-4 py-2 text-white inline-flex items-center gap-2"><Trash2 className="w-4 h-4" /> DELETE LEAD</button></div></div> : null}
      </div>
    </div>
  );
}

// Remaining production repo files to add next:
// app/layout.tsx
// app/globals.css
// package.json
// next.config.js
// tailwind.config.ts
// postcss.config.js
// tsconfig.json
// .env.example
// lib/supabase.ts
// app/api/reminders/route.ts
// vercel.json
