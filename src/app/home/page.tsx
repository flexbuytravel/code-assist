"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Sidebar from "@/components/layout/Sidebar";

export default function ClaimPackagePage() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packageId, setPackageId] = useState("");
  const [referralId, setReferralId] = useState("");
  const [pkgData, setPkgData] = useState<any>(null);

  useEffect(() => {
    const pkgParam = searchParams.get("packageId");
    const refParam = searchParams.get("referralId");

    if (pkgParam) setPackageId(pkgParam);
    if (refParam) setReferralId(refParam);

    if (pkgParam) {
      loadPackage(pkgParam);
    }
  }, [searchParams]);

  const loadPackage = async (id: string) => {
    const pkgDoc = await getDoc(doc(db, "packages", id));
    if (pkgDoc.exists()) {
      setPkgData(pkgDoc.data());
    }
  };

  const handleRegister = () => {
    router.push(
      `/auth/register?packageId=${packageId}&referralId=${referralId}`
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Claim Package</h1>
        <div className="space-y-4 max-w-md bg-white p-6 shadow rounded">
          <input
            type="text"
            placeholder="Package ID"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            disabled={!!searchParams.get("packageId")}
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Referral ID"
            value={referralId}
            onChange={(e) => setReferralId(e.target.value)}
            disabled={!!searchParams.get("referralId")}
            className="w-full border p-2 rounded"
          />
          {pkgData && (
            <div className="bg-gray-50 p-4 border rounded">
              <p>Package Name: {pkgData.name}</p>
              <p>Price: ${pkgData.price}</p>
            </div>
          )}
          <button
            onClick={handleRegister}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            Register & Claim
          </button>
        </div>
      </main>
    </div>
  );
}