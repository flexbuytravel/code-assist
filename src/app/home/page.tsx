"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [packageId, setPackageId] = useState("");
  const [referralId, setReferralId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoadPackage = async () => {
    setError("");
    if (!packageId || !referralId) {
      setError("Both Package ID and Referral ID are required.");
      return;
    }

    setLoading(true);
    try {
      // Validate package with backend before redirect
      const res = await fetch("/api/packages/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, referralId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid package or referral ID.");

      // Redirect to register page with package & referral IDs in URL
      router.push(`/auth/register?packageId=${encodeURIComponent(packageId)}&referralId=${encodeURIComponent(referralId)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Package ID"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Referral ID"
          value={referralId}
          onChange={(e) => setReferralId(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={handleLoadPackage}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Load Package"}
        </button>
      </div>
    </div>
  );
}