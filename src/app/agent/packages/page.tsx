"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getRoleFromClaims, hasRole } from "@/lib/roles";
import Sidebar from "@/components/layout/Sidebar";

export default function AgentPackages() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);

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
      const q = query(collection(db, "packages"), where("agentId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [auth, db, router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">My Packages</h1>
        <table className="w-full bg-white shadow rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {packages.map(pkg => (
              <tr key={pkg.id} className="border-b">
                <td className="p-3">{pkg.name}</td>
                <td className="p-3">${pkg.price}</td>
                <td className="p-3">{pkg.claimed ? "Claimed" : "Available"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}