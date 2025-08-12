"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function CompanyPackagesPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = async () => {
    if (!auth.currentUser) return;

    const companyId = auth.currentUser.uid;
    const packagesRef = collection(db, "packages");
    const q = query(packagesRef, where("companyId", "==", companyId));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setPackages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, [auth.currentUser]);

  if (loading) return <p>Loading packages...</p>;

  return (
    <div>
      <h1>Company Packages</h1>
      {packages.length === 0 && <p>No packages found for your company.</p>}
      <ul>
        {packages.map(pkg => (
          <li key={pkg.id}>
            <p>Package ID: {pkg.id}</p>
            <p>Price: ${pkg.price}</p>
            {pkg.agentId ? (
              <p>Agent: {pkg.agentName || pkg.agentId}</p>
            ) : pkg.deletedAgent ? (
              <p>Agent: [Deleted]</p>
            ) : (
              <p>Agent: [Unassigned]</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}