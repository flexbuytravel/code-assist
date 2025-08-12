"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packageId, setPackageId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [error, setError] = useState("");

  // Prefill from link
  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralCode");
    if (pkg && ref) {
      setPackageId(pkg);
      setReferralCode(ref);
      setIsPrefilled(true);
    }
  }, [searchParams]);

  const handleLoadPackage = async () => {
    setError("");

    if (!packageId || !referralCode) {
      setError("Please enter both Package ID and Referral Code.");
      return;
    }

    try {
      // Optional: Check if package is valid before proceeding
      const res = await fetch(`/api/packages/validate?packageId=${packageId}&referralCode=${referralCode}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError("Invalid Package ID or Referral Code.");
        return;
      }

      // Redirect to register with package details
      router.push(`/auth/register?packageId=${packageId}&referralCode=${referralCode}`);
    } catch (err) {
      console.error(err);
      setError("Error loading package. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>

      <label className="block mb-2">Package ID</label>
      <input
        type="text"
        value={packageId}
        onChange={(e) => setPackageId(e.target.value)}
        disabled={isPrefilled}
        className="w-full border p-2 rounded mb-4"
      />

      <label className="block mb-2">Referral Code</label>
      <input
        type="text"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        disabled={isPrefilled}
        className="w-full border p-2 rounded mb-4"
      />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleLoadPackage}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Load Package
      </button>
    </div>
  );
}