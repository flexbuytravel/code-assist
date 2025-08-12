"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function HomePage() {
  const searchParams = useSearchParams();
  const db = getFirestore(app);

  const [packageId, setPackageId] = useState("");
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill if link contains packageId
  useEffect(() => {
    const pkgFromLink = searchParams.get("packageId");
    if (pkgFromLink) {
      setPackageId(pkgFromLink);
      fetchPackage(pkgFromLink);
    }
  }, [searchParams]);

  // Fetch package details
  const fetchPackage = async (pkgId: string) => {
    setLoading(true);
    setError("");

    try {
      const pkgRef = doc(db, "packages", pkgId);
      const snapshot = await getDoc(pkgRef);

      if (!snapshot.exists()) {
        setPackageData(null);
        setError("Package not found.");
      } else {
        setPackageData(snapshot.data());
      }
    } catch (err) {
      console.error("Error fetching package:", err);
      setError("Failed to fetch package details.");
    }

    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageId.trim()) return;
    fetchPackage(packageId.trim());
  };

  return (
    <div>
      <h1>Claim a Package</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter Package ID"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          disabled={!!searchParams.get("packageId")}
        />
        {!searchParams.get("packageId") && <button type="submit">Load Package</button>}
      </form>

      {loading && <p>Loading package...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {packageData && (
        <div>
          <h2>Package Details</h2>
          <p>Package ID: {packageId}</p>
          <p>Price: ${packageData.price}</p>

          {packageData.agentId ? (
            <p>Agent: {packageData.agentName || packageData.agentId}</p>
          ) : packageData.deletedAgent ? (
            <p>Agent: [Deleted]</p>
          ) : (
            <p>Agent: [Unassigned]</p>
          )}

          {packageData.companyId && <p>Company ID: {packageData.companyId}</p>}
        </div>
      )}
    </div>
  );
}