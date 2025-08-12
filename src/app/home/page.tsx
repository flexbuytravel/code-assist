"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const linkPackageId = searchParams.get("packageId") || "";
  const linkReferralId = searchParams.get("referralId") || "";

  const [packageId, setPackageId] = useState(linkPackageId);
  const [referralId, setReferralId] = useState(linkReferralId);

  const isPrefilled = !!linkPackageId && !!linkReferralId;

  const handleLoadPackage = () => {
    if (!packageId || !referralId) {
      alert("Please enter both Package ID and Referral ID.");
      return;
    }

    // Send to register page with both IDs in query
    router.push(`/auth/register?packageId=${packageId}&referralId=${referralId}`);
  };

  return (
    <div>
      <h1>Claim Your Package</h1>
      <p>Enter your package details to continue.</p>

      <div>
        <label>Package ID</label>
        <input
          type="text"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          readOnly={isPrefilled}
        />
      </div>

      <div>
        <label>Referral ID</label>
        <input
          type="text"
          value={referralId}
          onChange={(e) => setReferralId(e.target.value)}
          readOnly={isPrefilled}
        />
      </div>

      <button onClick={handleLoadPackage}>Load Package</button>
    </div>
  );
}