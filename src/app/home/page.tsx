"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get from referral link if present
  const referralFromLink = searchParams.get("referralId") || "";
  const packageFromLink = searchParams.get("packageId") || "";

  // State for manual entry
  const [packageId, setPackageId] = useState(packageFromLink);
  const [referralId, setReferralId] = useState(referralFromLink);
  const [error, setError] = useState("");

  const lockedFields = Boolean(packageFromLink && referralFromLink);

  // Optional: load theme/branding if coming from referral
  useEffect(() => {
    if (lockedFields) {
      console.log(`Loaded referral link for package: ${packageFromLink}`);
    }
  }, [lockedFields, packageFromLink]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!packageId || !referralId) {
      setError("Both Package ID and Referral ID are required.");
      return;
    }

    // Send them to registration with IDs in query params
    router.push(
      `/customer/register?packageId=${encodeURIComponent(packageId)}&referralId=${encodeURIComponent(referralId)}`
    );
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-4 text-center">Claim Your Package</h1>
      <p className="text-gray-600 mb-6 text-center">
        Enter your Package ID and Referral ID to begin registration.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Package ID</label>
          <input
            type="text"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            readOnly={lockedFields}
            className={`border p-2 w-full ${lockedFields ? "bg-gray-100" : ""}`}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Referral ID</label>
          <input
            type="text"
            value={referralId}
            onChange={(e) => setReferralId(e.target.value)}
            readOnly={lockedFields}
            className={`border p-2 w-full ${lockedFields ? "bg-gray-100" : ""}`}
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Load Package
        </button>
      </form>
    </div>
  );
}