"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Profile = {
  id: string;
  email: string;
  display_name: string;
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

export function useAuthProfile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    async function bootstrapAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        setSessionUserId(session.user.id);
        setEmail(session.user.email || "");
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSessionUserId(session?.user?.id || null);
          setEmail(session?.user?.email || "");
        }
      );

      setAuthLoading(false);

      return () => {
        listener.subscription.unsubscribe();
      };
    }

    bootstrapAuth();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!sessionUserId || !SUPABASE_URL) {
        setProfile(null);
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${sessionUserId}&select=*`,
          {
            headers: supabaseHeaders(),
            cache: "no-store",
          }
        );

        if (!res.ok) throw new Error();

        const rows = await res.json();
        setProfile(rows?.[0] || null);
      } catch {
        setProfile(null);
      }
    }

    loadProfile();
  }, [sessionUserId]);

  async function signIn() {
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setAuthError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSessionUserId(null);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    sessionUserId,
    profile,
    authLoading,
    authError,
    signIn,
    signOut,
  };
}
