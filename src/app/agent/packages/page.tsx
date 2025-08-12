"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AgentPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Not authenticated");

        // Get agentId from logged-in user's profile
        const userSnap = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid))
        );
        if (userSnap.empty) throw new Error("User not found");

        const userData = userSnap.docs[0].data();
        const agentId = userData.agentId;

        // Fetch packages for this agent
        const packagesSnap = await getDocs(
          query(collection(db, "packages"), where("agentId", "==", agentId))
        );
        setPackages(packagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return <p className="p-4">Loading packages...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Packages</h1>
      {packages.length > 0 ? (
        <ul className="list-disc pl-6">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              {pkg.title} — ${pkg.price}
            </li>
          ))}
        </ul>
      ) : (
        <p>No packages found.</p>
      )}
    </div>
  );
}