"use client";

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase"; // Adjust path if different
import { useAuth } from "@/hooks/useAuth"; // Your custom auth hook (must provide user)

export default function CreatePackagePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("❌ You must be signed in as an agent to create a package.");
      return;
    }

    if (!name.trim() || !price.trim()) {
      setMessage("❌ Package name and price are required.");
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions(app);
      const createPackageFn = httpsCallable(functions, "createPackage");

      const res: any = await createPackageFn({
        name,
        description,
        price: parseFloat(price)
      });

      setMessage(`✅ Package created successfully! Referral Code: ${res.data.package.referralCode}`);
      setName("");
      setDescription("");
      setPrice("");
    } catch (err: any) {
      console.error("Error creating package:", err);
      setMessage(`❌ ${err.message || "Failed to create package."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Package</h1>
      <form onSubmit={handleCreatePackage} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Package Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Price (USD)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border p-2 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Package"}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          {message}
        </div>
      )}
    </div>
  );
}