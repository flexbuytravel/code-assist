"use client";

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase"; // adjust if path differs
import { useAuth } from "@/hooks/useAuth";

export default function ClaimPackagePage() {
  const { user } = useAuth();
  const [packageId, setPackageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleClaimPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("❌ You must be signed in to claim a package.");
      return;
    }

    if (user.role !== "customer") {
      setMessage("❌ Only customers can claim packages.");
      return;
    }

    if (!packageId.trim()) {
      setMessage("❌ Package ID is required.");
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions(app);
      const claimPackageFn = httpsCallable(functions, "claimPackage");

      await claimPackageFn({ packageId }); // ✅ no customerId passed

      setMessage("✅ Package claimed successfully!");
      setPackageId("");
    } catch (err: any) {
      console.error("Error claiming package:", err);
      if (err.message?.includes("already been claimed")) {
        setMessage("❌ This package has already been claimed.");
      } else if (err.message?.includes("not-found")) {
        setMessage("❌ Package not found.");
      } else {
        setMessage(`❌ ${err.message || "Failed to claim package."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Claim Package</h1>
      {user?.role === "customer" ? (
        <form onSubmit={handleClaimPackage} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Package ID</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Claiming..." : "Claim Package"}
          </button>
        </form>
      ) : (
        <div className="p-2 border rounded bg-gray-50">
          ❌ Only customers can claim packages.
        </div>
      )}
      {message && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          {message}
        </div>
      )}
    </div>
  );
}