"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getRoleFromClaims, hasRole } from "@/lib/roles";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminDashboard() {
  const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      const role = await getRoleFromClaims(currentUser);
      const userObj = { ...currentUser, role };
      if (!hasRole(userObj, "admin")) {
        router.push("/auth/login");
        return;
      }
      setUser(userObj);
    });
    return () => unsub();
  }, [auth, router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>Welcome, {user?.email}</p>
      </main>
    </div>
  );
}