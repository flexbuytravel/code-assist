"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AgentDashboard() {
  const [agent, setAgent] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Not authenticated");

        // Get agent document for logged-in user
        const userSnap = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid))
        );
        if (userSnap.empty) throw new Error("User not found");

        const userData = userSnap.docs[0].data();
        const agentId = userData.agentId;

        // Fetch agent doc
        const agentSnap = await getDocs(
          query(collection(db, "agents"), where("id", "==", agentId))
        );
        if (!agentSnap.empty) {
          setAgent(agentSnap.docs[0].data());
        }

        // Fetch packages created by this agent
        const packagesSnap = await getDocs(
          query(collection(db, "packages"), where("agentId", "==", agentId))
        );
        setPackages(packagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Error loading agent dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, []);

  if (loading) {
    return <p className="p-4">Loading agent dashboard...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>

      {agent && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="font-bold text-lg">{agent.name}</h2>
          <p>{agent.email}</p>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-3">Your Packages</h2>
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