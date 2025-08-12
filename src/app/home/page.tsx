"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase"; // your Firebase client init

const db = getFirestore(app);

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packageId, setPackageId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill fields from referral link
  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralCode");
    if (pkg) setPackageId(pkg);
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const loadPackage = async () => {
    if (!packageId || !referralCode) {
      setError("Please enter both Package ID and Referral Code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const packageRef = doc(db, "packages", packageId);
      const packageSnap = await getDoc(packageRef);

      if (!packageSnap.exists()) {
        setError("Package not found.");
        setPackageData(null);
        return;
      }

      const data = packageSnap.data();

      // Optional: verify referralCode matches agent/company relationship
      if (data.referralCode !== referralCode) {
        setError("Invalid referral code for this package.");
        setPackageData(null);
        return;
      }

      setPackageData(data);
    } catch (err) {
      console.error(err);
      setError("Error loading package.");
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    router.push(
      `/auth/register?packageId=${encodeURIComponent(
        packageId
      )}&referralCode=${encodeURIComponent(referralCode)}`
    );
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>

      {/* Package ID input */}
      <label className="block mb-2 font-semibold">Package ID</label>
      <input
        type="text"
        value={packageId}
        onChange={(e) => setPackageId(e.target.value)}
        disabled={!!searchParams.get("packageId")}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {/* Referral Code input */}
      <label className="block mb-2 font-semibold">Referral Code</label>
      <input
        type="text"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        disabled={!!searchParams.get("referralCode")}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {/* Load Package Button */}
      <button
        onClick={loadPackage}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? "Loading..." : "Load Package"}
      </button>

      {/* Error */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Package Preview */}
      {packageData && (
        <div className="border p-4 rounded mb-4">
          <h2 className="text-xl font-semibold">{packageData.title}</h2>
          <p>{packageData.description}</p>
          <p className="font-bold mt-2">
            Price: ${packageData.price?.toFixed(2)}
          </p>
          <p>Trips Included: {packageData.trips}</p>
        </div>
      )}

      {/* Register Button */}
      {packageData && (
        <button
          onClick={goToRegister}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Register
        </button>
      )}
    </div>
  );
}