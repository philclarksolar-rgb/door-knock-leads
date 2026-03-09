"use client";

import React from "react";
import { Search, CheckCircle2, ExternalLink } from "lucide-react";

export type AddressOption = {
  id: string | number;
  display_name: string;
  lat: number;
  lon: number;
  mapsUrl: string;
};

export type SearchDraft = {
  type: "specific" | "geo" | "chronological";
  text: string;
  geoAddressInput: string;
  geoVerifiedAddress: AddressOption | null;
  radiusMiles: number;
  chronologicalPreset: "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom";
  dateStart: string;
  dateEnd: string;
};

function toDateInputValue(d?: Date | string | null) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

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

export default function SearchPanel({
  searchDraft,
  setSearchDraft,
}: {
  searchDraft: SearchDraft;
  setSearchDraft: React.Dispatch<React.SetStateAction<SearchDraft>>;
}) {
  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 text-lg font-semibold">
        <Search className="h-5 w-5" /> Search
      </div>

      <div>
        <label className="text-sm font-medium">Search Type</label>
        <select
          value={searchDraft.type}
          onChange={(e) =>
            setSearchDraft((p) => ({ ...p, type: e.target.value as any }))
          }
          className="mt-1 w-full rounded-2xl border px-3 py-2"
        >
          <option value="specific">Find a Specific Lead</option>
          <option value="geo">Geographical Search</option>
          <option value="chronological">Chronological Search</option>
        </select>
      </div>

      {searchDraft.type === "specific" ? (
        <div>
          <label className="text-sm font-medium">Name / Address / Phone / Email</label>
          <input
            value={searchDraft.text}
            onChange={(e) => setSearchDraft((p) => ({ ...p, text: e.target.value }))}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          />
        </div>
      ) : null}

      {searchDraft.type === "geo" ? (
        <>
          <AddressAutocompleteField
            label="Reference address"
            value={searchDraft.geoAddressInput}
            onValueChange={(v) =>
              setSearchDraft((p) => ({
                ...p,
                geoAddressInput: v,
                geoVerifiedAddress:
                  p.geoVerifiedAddress?.display_name === v ? p.geoVerifiedAddress : null,
              }))
            }
            selected={searchDraft.geoVerifiedAddress}
            onSelect={(item) =>
              setSearchDraft((p) => ({
                ...p,
                geoAddressInput: item.display_name,
                geoVerifiedAddress: item,
              }))
            }
            placeholder="Enter address for radius search"
          />
          <div>
            <label className="text-sm font-medium">Radius (0-50 miles)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={searchDraft.radiusMiles}
              onChange={(e) =>
                setSearchDraft((p) => ({
                  ...p,
                  radiusMiles: Math.max(0, Math.min(50, Number(e.target.value || 0))),
                }))
              }
              className="mt-1 w-full rounded-2xl border px-3 py-2"
            />
          </div>
        </>
      ) : null}

      {searchDraft.type === "chronological" ? (
        <>
          <div>
            <label className="text-sm font-medium">Time Range</label>
            <select
              value={searchDraft.chronologicalPreset}
              onChange={(e) =>
                setSearchDraft((p) => ({
                  ...p,
                  chronologicalPreset: e.target.value as any,
                }))
              }
              className="mt-1 w-full rounded-2xl border px-3 py-2"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {searchDraft.chronologicalPreset === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start</label>
                <input
                  type="date"
                  max={toDateInputValue(new Date())}
                  value={searchDraft.dateStart}
                  onChange={(e) =>
                    setSearchDraft((p) => ({ ...p, dateStart: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End</label>
                <input
                  type="date"
                  max={toDateInputValue(new Date())}
                  value={searchDraft.dateEnd}
                  onChange={(e) =>
                    setSearchDraft((p) => ({ ...p, dateEnd: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border px-3 py-2"
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
