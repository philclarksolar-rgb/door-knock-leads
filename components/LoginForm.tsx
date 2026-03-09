"use client";

import React from "react";

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  authError,
  onSignIn,
}: {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  authError: string;
  onSignIn: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-md rounded-3xl border bg-white p-6 shadow-sm space-y-4">
        <div className="text-3xl font-bold">QUICK</div>
        <div className="text-slate-600">Sign in</div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-3 py-2"
          />
        </div>

        {authError ? <div className="text-sm text-red-600">{authError}</div> : null}

        <button
          onClick={onSignIn}
          className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-white"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
