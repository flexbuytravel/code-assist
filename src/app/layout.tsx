"use client";

import "./globals.css";
import { ReactNode, useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth";
import Link from "next/link";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await getIdTokenResult(user, true);
          setRole(token.claims.role || null);
        } catch (err) {
          console.error("Error fetching claims:", err);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <html lang="en">
      <body>
        <header style={{ padding: "1rem", background: "#eee" }}>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link href="/">Home</Link>

            {role === "admin" && <Link href="/admin">Admin Dashboard</Link>}
            {role === "company" && <Link href="/company">Company Dashboard</Link>}
            {role === "agent" && <Link href="/agent">Agent Dashboard</Link>}
            {role === "customer" && <Link href="/customer">My Packages</Link>}

            {role ? (
              <button onClick={handleLogout}>Logout</button>
            ) : (
              <Link href="/login">Login</Link>
            )}
          </nav>
        </header>

        <main style={{ padding: "1rem" }}>
          {loading ? <p>Loading...</p> : children}
        </main>
      </body>
    </html>
  );
}