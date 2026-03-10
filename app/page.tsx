"use client";

export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>PHILDOOR DEBUG PAGE</h1>
      <p style={{ fontSize: 20, marginBottom: 8 }}>
        If you can see this, the homepage route is working.
      </p>
      <p style={{ fontSize: 16, marginBottom: 8 }}>
        NEXT_PUBLIC_SUPABASE_URL present:{" "}
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? "YES" : "NO"}
      </p>
      <p style={{ fontSize: 16 }}>
        NEXT_PUBLIC_SUPABASE_ANON_KEY present:{" "}
        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "YES" : "NO"}
      </p>
    </main>
  );
}
