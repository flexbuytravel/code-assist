"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packageId, setPackageId] = useState(searchParams.get("packageId") || "");
  const [referralId, setReferralId] = useState(searchParams.get("referralId") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoadPackage = async () => {
    if (!packageId) {
      setError("Package ID is required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const pkgRef = doc(db, "packages", packageId);
      const pkgSnap = await getDoc(pkgRef);

      if (!pkgSnap.exists()) {
        setError("Package not found.");
        return;
      }
      const pkgData = pkgSnap.data();
      if (pkgData.claimedBy) {
        setError("This package is already claimed.");
        return;
      }

      // Redirect to registration page with IDs in URL
      router.push(`/register-customer?packageId=${packageId}&referralId=${referralId || ""}`);
    } catch (err) {
      console.error(err);
      setError("Error loading package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Image src="/logo2.png" alt="FlexBuy Logo" width={150} height={150} className="mb-6" />
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>

        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}

        <label className="block mb-2 font-medium">Package ID</label>
        <input
          type="text"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className="border rounded p-2 w-full mb-4"
        />

        <label className="block mb-2 font-medium">Referral ID (Optional)</label>
        <input
          type="text"
          value={referralId}
          onChange={(e) => setReferralId(e.target.value)}
          className="border rounded p-2 w-full mb-4"
        />

        <button
          onClick={handleLoadPackage}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
        >
          {loading ? "Loading..." : "Load Package"}
        </button>
      </div>
    </div>
  );
}