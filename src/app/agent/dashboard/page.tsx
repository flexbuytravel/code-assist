"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getRoleFromClaims, hasRole } from "@/lib/roles";
import Sidebar from "@/components/layout/Sidebar";

export default function AgentDashboard() {
  const auth = getAuth();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      const role = await getRoleFromClaims(currentUser);
      if (!hasRole({ ...currentUser, role }, "agent")) {
        router.push("/auth/login");
        return;
      }
      setAgent(currentUser);
    });
    return () => unsub();
  }, [auth, router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Agent Dashboard</h1>
        <p>Welcome, {agent?.email}</p>
      </main>
    </div>
  );
}