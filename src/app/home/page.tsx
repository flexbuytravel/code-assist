"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [packageId, setPackageId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");

  const handleLoadPackage = async () => {
    setError("");

    try {
      const res = await fetch("/api/customer/package/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, referralCode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Package validation failed");
      }

      const data = await res.json();

      // Redirect to registration page with validated package info
      router.push(
        `/auth/register?packageId=${encodeURIComponent(
          data.packageId
        )}&referralCode=${encodeURIComponent(data.referralCode)}`
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Claim Your Package</h1>
      <input
        type="text"
        placeholder="Package ID"
        value={packageId}
        onChange={(e) => setPackageId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Referral Code"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
      />
      <button onClick={handleLoadPackage}>Load Package</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}