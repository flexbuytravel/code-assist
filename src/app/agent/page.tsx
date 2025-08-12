"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Secure role-based access for Agents
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/home");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (!userDoc.exists()) {
          setError("User record not found.");
          return;
        }
        const userData = userDoc.data();
        if (userData.role !== "agent") {
          router.push("/home");
          return;
        }
        setUser({ uid: u.uid, ...userData });
      } catch (err) {
        console.error(err);
        setError("Error loading agent dashboard.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // 🔹 Original Agent UI
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Agent Dashboard</h1>
      <p className="mb-6 text-lg">Welcome, {user?.name || "Agent"}.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Package */}
        <Link
          href="/agent/create-package"
          className="bg-blue-600 hover:bg-blue-700