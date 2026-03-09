"use client";

import { useMemo } from "react";
import type { Lead } from "../lib/leadUtils";
import {
  computeLeadStatus,
  getChronologicalRange,
  haversineMiles,
  normalizeText,
} from "../lib/leadUtils";

import type { SearchDraft } from "../components/SearchPanel";

const PAGE_SIZE = 30;

export function useLeadFilters({
  leads,
  searchDraft,
  page,
}: {
  leads: Lead[];
  searchDraft: SearchDraft;
  page: number;
}) {
  const filtered = useMemo(() => {
    let matched = leads;

    // closed deal filtering
    if (!searchDraft.includeClosedDeals && searchDraft.statusFilter !== "Closed Deal") {
      matched = matched.filter((lead) => !lead.isClosed);
    }

    // status filtering
    if (searchDraft.statusFilter !== "all") {
      matched = matched.filter(
        (lead) => computeLeadStatus(lead) === searchDraft.statusFilter
      );
    }

    // specific search
    if (searchDraft.type === "specific") {
      const q = normalizeText(searchDraft.text);

      if (q) {
        matched = matched.filter((lead) =>
          [lead.fullName, lead.address, lead.phone, lead.email].some((field) =>
            normalizeText(field).includes(q)
          )
        );
      }
    }

    // geo search
    if (searchDraft.type === "geo") {
      const ref = searchDraft.geoVerifiedAddress;

      if (!ref) {
        matched = [];
      } else {
        matched = matched.filter(
          (lead) =>
            lead.lat != null &&
            lead.lon != null &&
            haversineMiles(ref.lat, ref.lon, lead.lat, lead.lon) <=
              Number(searchDraft.radiusMiles || 0) + 0.05
        );
      }
    }

    // chronological search
    if (searchDraft.type === "chronological") {
      const { rangeStart, rangeEnd } = getChronologicalRange(
        searchDraft.chronologicalPreset,
        searchDraft.dateStart,
        searchDraft.dateEnd
      );

      matched = matched.filter((lead) => {
        const created = new Date(lead.createdAt);

        if (rangeStart && created < rangeStart) return false;
        if (rangeEnd && created > rangeEnd) return false;

        return true;
      });
    }

    return matched.slice().sort((a, b) => {
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [leads, searchDraft]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return {
    filtered,
    paged,
    totalPages,
    currentPage,
  };
}
