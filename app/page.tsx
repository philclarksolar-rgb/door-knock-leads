"use client";

export default function Page() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "system-ui, Arial",
        background: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 20 }}>
        PHILDOOR DEBUG PAGE
      </h1>

      <div style={{ fontSize: 18, marginBottom: 12 }}>
        If you can see this page, the Next.js app is rendering correctly.
      </div>

      <div style={{ fontSize: 16, marginBottom: 8 }}>
        NEXT_PUBLIC_SUPABASE_URL loaded:{" "}
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? "YES" : "NO"}
      </div>

      <div style={{ fontSize: 16, marginBottom: 8 }}>
        NEXT_PUBLIC_SUPABASE_ANON_KEY loaded:{" "}
        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "YES" : "NO"}
      </div>

      <div style={{ marginTop: 30, fontSize: 14, opacity: 0.7 }}>
        Deployment test successful.
      </div>
    </main>
  );
}
