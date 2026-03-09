"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type ProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at?: string;
};

function supabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY || "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const userId = session?.user?.id;
        if (!userId) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const profileRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: supabaseHeaders(),
            cache: "no-store",
          }
        );

        if (!profileRes.ok) throw new Error("Could not load your profile.");

        const profileRows = await profileRes.json();
        const me = profileRows?.[0];

        if (!me || me.role !== "master_admin") {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);

        const usersRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.asc`,
          {
            headers: supabaseHeaders(),
            cache: "no-store",
          }
        );

        if (!usersRes.ok) throw new Error("Could not load users.");

        const users = await usersRes.json();
        setRows(users || []);
      } catch (err: any) {
        setError(err?.message || "Could not load admin page.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-8">Loading admin...</div>;
  }

  if (!authorized) {
    return <div className="p-8">Not authorized.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white">
          <div className="text-3xl font-bold">ADMIN</div>
          <div className="text-slate-300">User management</div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_1fr_1fr] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-medium uppercase text-slate-500">
            <div>First</div>
            <div>Last</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Role</div>
            <div>Status</div>
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_1fr_1fr] gap-3 border-b px-4 py-3 text-sm"
            >
              <div>{row.first_name || "—"}</div>
              <div>{row.last_name || "—"}</div>
              <div className="truncate">{row.email}</div>
              <div>{row.phone || "—"}</div>
              <div>{row.role}</div>
              <div>{row.is_active ? "Active" : "Inactive"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
