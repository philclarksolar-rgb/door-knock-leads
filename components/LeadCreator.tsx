"use client";

import React from "react";
import { Bell, CheckCircle2, ExternalLink } from "lucide-react";

export type AddressOption = {
  id: string | number;
  display_name: string;
  lat: number;
  lon: number;
  mapsUrl: string;
};

export type LeadDraft = {
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

function useAddressAutocomplete(query: string, enabled = true) {
  const [results, setResults] = React.useState<AddressOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
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
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(
          query.trim()
        )}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Address lookup failed.");
        const data = await res.json();
        setResults(
          (data || []).map((item: any) => ({
            id: item.place_id,
            display_name: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
            mapsUrl: `https://maps.google.com/?q=${item.lat},${item.lon}`,
          }))
        );
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

function AddressAutocompleteField({
  label,
  value,
  onValueChange,
  selected,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  selected: AddressOption | null;
  onSelect: (v: AddressOption) => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { results, loading, error } = useAddressAutocomplete(value, true);

  React.useEffect(() => {
    setOpen(!!value && value.trim().length >= 3);
  }, [value]);

  return (
    <div className="relative space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-2xl border px-3 py-2"
      />
      {selected ? (
        <div className="space-y-1 rounded-2xl border bg-emerald-50 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Verified Address
          </div>
          <div>{selected.display_name}</div>
          <div className="text-xs text-slate-500">
            Lat {selected.lat.toFixed(6)} · Lng {selected.lon.toFixed(6)}
          </div>
          <a
            href={selected.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs underline"
          >
            <ExternalLink className="h-3 w-3" /> Open in Maps
          </a>
        </div>
      ) : null}
      {open && value.trim().length >= 3 ? (
        <div className="absolute left-0 right-0 top-[72px] z-20 overflow-hidden rounded-2xl border bg-white shadow-lg">
          {loading ? (
            <div className="p-3 text-sm text-slate-500">Finding matching addresses...</div>
          ) : null}
          {!loading && results.length === 0 && !error ? (
            <div className="p-3 text-sm text-slate-500">No matches yet.</div>
          ) : null}
          {error ? <div className="p-3 text-sm text-red-500">{error}</div> : null}
          {!loading &&
            results.map((item) => (
              <button
                key={String(item.id)}
                onClick={() => {
                  onValueChange(item.display_name);
                  onSelect(item);
                  setOpen(false);
                }}
                className="w-full border-t px-3 py-3 text-left text-sm hover:bg-slate-50 first:border-t-0"
              >
                {item.display_name}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

export default function LeadCreator({
  leadDraft,
  setLeadDraft,
  onCreateLead,
}: {
  leadDraft: LeadDraft;
  setLeadDraft: React.Dispatch<React.SetStateAction<LeadDraft>>;
  onCreateLead: () => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="text-lg font-semibold">Create Lead</div>

      <AddressAutocompleteField
        label="Address *"
        value={leadDraft.addressInput}
        onValueChange={(v) =>
          setLeadDraft((p) => ({
            ...p,
            addressInput: v,
            verifiedAddress: p.verifiedAddress?.display_name === v ? p.verifiedAddress : null,
          }))
        }
        selected={leadDraft.verifiedAddress}
        onSelect={(item) =>
          setLeadDraft((p) => ({
            ...p,
            addressInput: item.display_name,
            verifiedAddress: item,
          }))
        }
        placeholder="Start typing the address"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Full Name *</label>
          <input
            value={leadDraft.fullName}
            onChange={(e) => setLeadDraft((p) => ({ ...p, fullName: e.target.value }))}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Phone *</label>
          <input
            value={leadDraft.phone}
            onChange={(e) => setLeadDraft((p) => ({ ...p, phone: e.target.value }))}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Email</label>
          <input
            value={leadDraft.email}
            onChange={(e) => setLeadDraft((p) => ({ ...p, email: e.target.value }))}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Utility Bill?</label>
          <select
            value={leadDraft.utilityBill}
            onChange={(e) => setLeadDraft((p) => ({ ...p, utilityBill: e.target.value }))}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Appointment?</label>
          <select
            value={leadDraft.appointment}
            onChange={(e) => setLeadDraft((p) => ({ ...p, appointment: e.target.value }))}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="inline-flex items-center gap-2 font-medium">
          <Bell className="h-4 w-4" /> Reminder
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={leadDraft.noFollowUp}
            onChange={(e) =>
              setLeadDraft((p) => ({
                ...p,
                noFollowUp: e.target.checked,
                reminderDate: e.target.checked ? "" : p.reminderDate,
              }))
            }
          />
          NO FOLLOW-UP
        </label>
        {!leadDraft.noFollowUp ? (
          <div>
            <label className="text-sm font-medium">Reminder Date *</label>
            <input
              type="date"
              value={leadDraft.reminderDate}
              onChange={(e) => setLeadDraft((p) => ({ ...p, reminderDate: e.target.value }))}
              className="mt-1 w-full rounded-2xl border px-3 py-2"
            />
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onCreateLead}
          className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white"
        >
          Create Lead
        </button>
      </div>
    </div>
  );
}
