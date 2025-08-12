"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const prefilledPackageId = searchParams.get("packageId") || "";
  const prefilledReferral = searchParams.get("referralCode") || "";

  const [packageId, setPackageId] = useState(prefilledPackageId);
  const [referralCode, setReferralCode] = useState(prefilledReferral);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadPackage = async () => {
    setError("");

    if (!packageId || !referralCode) {
      setError("Package ID and Referral Code are required.");
      return;
    }

    try {
      setIsLoading(true);

      // Verify package exists
      const res = await fetch(`/api/packages/verify?packageId=${packageId}&referralCode=${referralCode}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid package or referral code.");
        setIsLoading(false);
        return;
      }

      // Redirect to register page with these params
      router.push(`/auth/register?packageId=${encodeURIComponent(packageId)}&referralCode=${encodeURIComponent(referralCode)}`);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>

      {error && <div className="bg-red-100 text-red-600 p-2 mb-4 rounded">{error}</div>}

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Package ID"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          readOnly={!!prefilledPackageId}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Referral Code"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          readOnly={!!prefilledReferral}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleLoadPackage}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          {isLoading ? "Loading..." : "Load Package"}
        </button>
      </div>
    </div>
  );
}