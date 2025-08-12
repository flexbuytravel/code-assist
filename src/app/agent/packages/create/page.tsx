"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getRoleFromClaims, hasRole } from "@/lib/roles";
import Sidebar from "@/components/layout/Sidebar";

export default function CreatePackagePage() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      const role = await getRoleFromClaims(currentUser);
      if (!hasRole({ ...currentUser, role }, "agent")) {
        router.push("/auth/login");
      }
    });
    return () => unsub();
  }, [auth, router]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "packages"), {
        name,
        price,
        agentId: auth.currentUser.uid,
        companyId: null, // Should be set in backend when package is linked
        createdAt: new Date(),
        claimed: false,
      });
      router.push("/agent/packages");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Create Package</h1>
        <form
          onSubmit={handleCreatePackage}
          className="space-y-4 max-w-md bg-white p-6 shadow rounded"
        >
          <input
            type="text"
            placeholder="Package Name"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            className="w-full border p-2 rounded"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            {loading ? "Creating..." : "Create Package"}
          </button>
        </form>
      </main>
    </div>
  );
}