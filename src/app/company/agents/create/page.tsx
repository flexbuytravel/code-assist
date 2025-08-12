"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getRoleFromClaims, hasRole, assignRole } from "@/lib/roles";
import Sidebar from "@/components/layout/Sidebar";

export default function CreateAgentPage() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      const role = await getRoleFromClaims(currentUser);
      if (!hasRole({ ...currentUser, role }, "company")) {
        router.push("/auth/login");
      }
    });
    return () => unsub();
  }, [auth, router]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const agentAuth = getAuth();
      const { user } = await createUserWithEmailAndPassword(agentAuth, email, password);
      await assignRole(user.uid, "agent");
      await setDoc(doc(db, "agents", user.uid), {
        name,
        email,
        companyId: auth.currentUser?.uid,
      });
      router.push("/company/agents");
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
        <h1 className="text-2xl font-bold mb-4">Create Agent</h1>
        <form onSubmit={handleCreateAgent} className="space-y-4 max-w-md bg-white p-6 shadow rounded">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            {loading ? "Creating..." : "Create Agent"}
          </button>
        </form>
      </main>
    </div>
  );
}