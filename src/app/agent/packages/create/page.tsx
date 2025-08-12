"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function CreatePackagePage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not authenticated");

      // Get agent record for logged-in user
      const userSnap = await getDocs(
        query(collection(db, "users"), where("uid", "==", uid))
      );
      if (userSnap.empty) throw new Error("User not found");

      const userData = userSnap.docs[0].data();
      const agentId = userData.agentId;

      // Get the full agent doc to pull companyId
      const agentDocRef = doc(db, "agents", agentId);
      const agentDocSnap = await getDoc(agentDocRef);
      if (!agentDocSnap.exists()) throw new Error("Agent record not found");

      const agentData = agentDocSnap.data();
      const companyId = agentData.companyId;

      // Create the package tied to this agent & company
      await addDoc(collection(db, "packages"), {
        title,
        price: parseFloat(price),
        agentId,
        companyId,
        createdAt: new Date(),
        claimed: false,
      });

      alert("Package created successfully!");
      router.push("/agent/packages");

    } catch (err) {
      console.error("Error creating package:", err);
      alert("Failed to create package. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Package</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block mb-1">Package Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded w-full p-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded w-full p-2"
            step="0.01"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Package"}
        </button>
      </form>
    </div>
  );
}