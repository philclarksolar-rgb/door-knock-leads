"use client";

import React from "react";
import { Search } from "lucide-react";
import type { LeadStatus } from "../lib/leadUtils";
import StatusFilter from "./search/StatusFilter";
import SpecificSearchFields from "./search/SpecificSearchFields";
import GeoSearchFields from "./search/GeoSearchFields";
import ChronologicalSearchFields from "./search/ChronologicalSearchFields";

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
  includeClosedDeals: boolean;
  statusFilter: "all" | LeadStatus;
};

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

      <StatusFilter
        statusFilter={searchDraft.statusFilter}
        setStatusFilter={(value) =>
          setSearchDraft((p) => ({ ...p, statusFilter: value }))
        }
        includeClosedDeals={searchDraft.includeClosedDeals}
        setIncludeClosedDeals={(value) =>
          setSearchDraft((p) => ({ ...p, includeClosedDeals: value }))
        }
      />

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
        <SpecificSearchFields
          text={searchDraft.text}
          setText={(value) =>
            setSearchDraft((p) => ({ ...p, text: value }))
          }
        />
      ) : null}

      {searchDraft.type === "geo" ? (
        <GeoSearchFields
          geoAddressInput={searchDraft.geoAddressInput}
          setGeoAddressInput={(value) =>
            setSearchDraft((p) => ({ ...p, geoAddressInput: value }))
          }
          geoVerifiedAddress={searchDraft.geoVerifiedAddress}
          setGeoVerifiedAddress={(value) =>
            setSearchDraft((p) => ({ ...p, geoVerifiedAddress: value }))
          }
          radiusMiles={searchDraft.radiusMiles}
          setRadiusMiles={(value) =>
            setSearchDraft((p) => ({ ...p, radiusMiles: value }))
          }
        />
      ) : null}

      {searchDraft.type === "chronological" ? (
        <ChronologicalSearchFields
          chronologicalPreset={searchDraft.chronologicalPreset}
          setChronologicalPreset={(value) =>
            setSearchDraft((p) => ({ ...p, chronologicalPreset: value }))
          }
          dateStart={searchDraft.dateStart}
          setDateStart={(value) =>
            setSearchDraft((p) => ({ ...p, dateStart: value }))
          }
          dateEnd={searchDraft.dateEnd}
          setDateEnd={(value) =>
            setSearchDraft((p) => ({ ...p, dateEnd: value }))
          }
        />
      ) : null}
    </div>
  );
}
