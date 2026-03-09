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

    await loadUsers();

    alert("User created. Temporary password: " + password);
  }

  if (loading) return <div className="p-8">Loading admin...</div>;
  if (!authorized) return <div className="p-8">Not authorized</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      <div className="mx-auto max-w-6xl space-y-6">

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">ADMIN</h1>

          <button
            onClick={() => setShowAddUser(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl"
          >
            + ADD USER
          </button>
        </div>

        {showAddUser && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-3">

            <input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border p-2 w-full"
            />

            <input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border p-2 w-full"
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full"
            />

            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 w-full"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border p-2 w-full"
            >
              <option value="rep">Rep</option>
              <option value="admin">Admin</option>
            </select>

            <button
              onClick={createUser}
              className="bg-green-600 text-white px-4 py-2 rounded-xl"
            >
              CREATE USER
            </button>

          </div>
        )}

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="grid grid-cols-6 gap-4 bg-slate-100 p-3 text-sm font-semibold">
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
              className="grid grid-cols-6 gap-4 border-t p-3 text-sm"
            >
              <div>{row.first_name}</div>
              <div>{row.last_name}</div>
              <div>{row.email}</div>
              <div>{row.phone}</div>
              <div>{row.role}</div>
              <div>{row.is_active ? "Active" : "Inactive"}</div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
