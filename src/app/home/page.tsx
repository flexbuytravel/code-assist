"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packageId, setPackageId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralCode");

    if (pkg && ref) {
      setPackageId(pkg);
      setReferralCode(ref);
      setLocked(true);
    }
  }, [searchParams]);

  const handleLoadPackage = () => {
    if (!packageId || !referralCode) return;
    router.push(
      `/auth/register?packageId=${encodeURIComponent(
        packageId
      )}&referralCode=${encodeURIComponent(referralCode)}`
    );
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>

      <div className="mb-4">
        <label className="block">Package ID</label>
        <input
          type="text"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          disabled={locked}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block">Referral Code</label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          disabled={locked}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleLoadPackage}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Load Package
      </button>
    </div>
  );
}