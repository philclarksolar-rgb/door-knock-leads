"use client";

import { LogOut, Plus, Search, Shield, Map, Save } from "lucide-react";
import { formatDateTime } from "../lib/leadUtils";

export default function HomeHeader({
  role,
  email,
  showSearch,
  setShowSearch,
  showMap,
  setShowMap,
  setShowCreate,
  signOut,
  autosaveAt,
  loadingLeads,
  dbError,
  leadCount,
}: any) {
  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <div className="text-3xl font-bold">QUICK</div>
          <div className="text-slate-300">
            {role === "master_admin" ? "Admin" : "Rep"} · {email}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => setShowSearch((v: boolean) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 font-semibold text-slate-900"
          >
            <Search className="h-4 w-4" />
            {showSearch ? "HIDE SEARCH" : "SEARCH"}
          </button>

          <button
            onClick={() => setShowMap((v: boolean) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 font-semibold text-slate-900"
          >
            <Map className="h-4 w-4" />
            {showMap ? "HIDE MAP" : "MAP"}
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-semibold text-slate-900"
          >
            <Plus className="h-4 w-4" />
            ADD NEW LEAD
          </button>

          {role === "master_admin" && (
            <a
              href="/admin"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 font-semibold text-slate-900"
            >
              <Shield className="h-4 w-4" />
              ADMIN
            </a>
          )}

          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white"
          >
            <LogOut className="h-4 w-4" />
            SIGN OUT
          </button>

        </div>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
        <Save className="h-3 w-3" />
        Autosaved every 3 seconds
        {autosaveAt ? ` · last saved ${formatDateTime(autosaveAt)}` : ""}
      </div>

      <div className="mt-2 text-xs text-slate-300">
        {loadingLeads
          ? "Loading Supabase leads..."
          : dbError
          ? dbError
          : `${leadCount} permanent lead(s) loaded from Supabase`}
      </div>
    </div>
  );
}
