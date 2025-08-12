"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Secure role-based access
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
        if (userData.role !== "admin") {
          router.push("/home");
          return;
        }
        setUser({ uid: u.uid, ...userData });
      } catch (err) {
        console.error(err);
        setError("Error loading admin dashboard.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // 🔹 Original Admin UI from your old folder
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-6 text-lg">Welcome, {user?.name || "Admin"}.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Manage Companies */}
        <Link
          href="/admin/manage-companies"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 shadow transition"
        >
          <h2 className="text-xl font-semibold mb-2">Manage Companies</h2>
          <p>Create, edit, and remove company accounts.</p>
        </Link>

        {/* Manage Agents */}
        <Link
          href="/admin/manage-agents"
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 shadow transition"
        >
          <h2 className="text-xl font-semibold mb-2">Manage Agents</h2>
          <p>View and control all agents across companies.</p>
        </Link>

        {/* Settings */}
        <Link
          href="/admin/settings"
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg p-6 shadow transition"
        >
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p>Update admin preferences and application settings.</p>
        </Link>
      </div>
    </div>
  );
}