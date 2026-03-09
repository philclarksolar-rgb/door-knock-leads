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
};

function supabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY || "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminPage() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showAddUser, setShowAddUser] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("rep");

  async function loadUsers() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.asc`,
      {
        headers: supabaseHeaders(),
        cache: "no-store",
      }
    );

    const users = await res.json();
    setRows(users || []);
  }

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: supabaseHeaders(),
        }
      );

      const profileRows = await profileRes.json();
      const me = profileRows?.[0];

      if (!me || me.role !== "master_admin") {
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await loadUsers();
      setLoading(false);
    }

    init();
  }, []);

  async function createUser() {
    const password = Math.random().toString(36).slice(2, 10);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        is_active: true,
      }),
    });

    setShowAddUser(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setRole("rep");

    await loadUsers();

    alert("User created. Temporary password: " + password);
  }

  if (loading) return <div className="p-8">Loading admin...</div>;
  if (!authorized) return <div className="p-8">Not authorized</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">ADMIN</h1>

          <button
            onClick={() => setShowAddUser(true)}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            + ADD USER
          </button>
        </div>

        {showAddUser && (
          <div className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
            <input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2"
            />

            <input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2"
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2"
            />

            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2"
            >
              <option value="rep">Rep</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex gap-3">
              <button
                onClick={createUser}
                className="rounded-2xl bg-green-600 px-4 py-2 text-white"
              >
                CREATE USER
              </button>

              <button
                onClick={() => setShowAddUser(false)}
                className="rounded-2xl border px-4 py-2"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="grid grid-cols-[1.5fr_1.2fr_1fr] gap-3 border-b bg-slate-100 px-4 py-3 text-sm font-semibold">
            <div>Name</div>
            <div>Phone</div>
            <div>Role</div>
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.5fr_1.2fr_1fr] gap-3 border-b px-4 py-3 text-sm"
            >
              <div className="truncate">
                {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
              </div>
              <div className="truncate">{row.phone || "—"}</div>
              <div className="truncate">{row.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
