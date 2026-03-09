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

function headers() {
  return {
    apikey: SUPABASE_ANON_KEY || "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminPage() {

  const [rows,setRows] = useState<ProfileRow[]>([]);
  const [loading,setLoading] = useState(true);
  const [authorized,setAuthorized] = useState(false);

  const [masterId,setMasterId] = useState<string>("");

  async function loadUsers() {

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.asc`,
      { headers: headers(), cache:"no-store" }
    );

    const data = await res.json();
    setRows(data || []);
  }

  useEffect(()=>{

    async function init(){

      const {data:{session}} = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if(!userId){
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        { headers: headers() }
      );

      const rows = await res.json();
      const me = rows?.[0];

      if(!me || me.role !== "master_admin"){
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setMasterId(userId);

      await loadUsers();

      setLoading(false);
    }

    init();

  },[]);

  async function disableUser(user:ProfileRow){

    if(user.id === masterId){
      alert("Master admin cannot be disabled.");
      return;
    }

    if(!confirm("Disable user and transfer all leads to you?")){
      return;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({is_active:false})
    });

    await fetch(`${SUPABASE_URL}/rest/v1/leads?owner_user_id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({
        previous_owner_user_id:user.id,
        owner_user_id:masterId
      })
    });

    await fetch(`${SUPABASE_URL}/rest/v1/notes?owner_user_id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({
        previous_owner_user_id:user.id,
        owner_user_id:masterId
      })
    });

    await fetch(`${SUPABASE_URL}/rest/v1/contact_log?owner_user_id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({
        previous_owner_user_id:user.id,
        owner_user_id:masterId
      })
    });

    await loadUsers();
  }

  async function enableUser(user:ProfileRow){

    if(!confirm("Re-enable user and restore their leads?")){
      return;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({is_active:true})
    });

    await fetch(`${SUPABASE_URL}/rest/v1/leads?previous_owner_user_id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({
        owner_user_id:user.id,
        previous_owner_user_id:null
      })
    });

    await fetch(`${SUPABASE_URL}/rest/v1/notes?previous_owner_user_id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({
        owner_user_id:user.id,
        previous_owner_user_id:null
      })
    });

    await fetch(`${SUPABASE_URL}/rest/v1/contact_log?previous_owner_user_id=eq.${user.id}`,{
      method:"PATCH",
      headers:{...headers(),Prefer:"return=minimal"},
      body:JSON.stringify({
        owner_user_id:user.id,
        previous_owner_user_id:null
      })
    });

    await loadUsers();
  }

  if(loading) return <div className="p-8">Loading admin...</div>;
  if(!authorized) return <div className="p-8">Not authorized</div>;

  return (

    <div className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-4xl space-y-6">

        <h1 className="text-3xl font-bold">ADMIN</h1>

        <div className="rounded-3xl bg-white shadow-sm overflow-hidden">

          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 border-b bg-slate-100 px-4 py-3 text-sm font-semibold">
            <div>Name</div>
            <div>Phone</div>
            <div>Role</div>
            <div>Actions</div>
          </div>

          {rows.map((row)=>{

            const name = [row.first_name,row.last_name].filter(Boolean).join(" ");

            return(

              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 border-b px-4 py-3 text-sm"
              >

                <div>{name}</div>

                <div>{row.phone || "—"}</div>

                <div>{row.role}</div>

                <div className="flex gap-2">

                  {row.id !== masterId && row.is_active && (

                    <button
                      onClick={()=>disableUser(row)}
                      className="rounded-lg bg-red-500 px-2 py-1 text-white text-xs"
                    >
                      Disable
                    </button>

                  )}

                  {row.id !== masterId && !row.is_active && (

                    <button
                      onClick={()=>enableUser(row)}
                      className="rounded-lg bg-green-600 px-2 py-1 text-white text-xs"
                    >
                      Re-Enable
                    </button>

                  )}

                  {row.id === masterId && (
                    <span className="text-xs text-gray-500">
                      Master
                    </span>
                  )}

                </div>

              </div>
            )
          })}

        </div>

      </div>

    </div>
  );
}
