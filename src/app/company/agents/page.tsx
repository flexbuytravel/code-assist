"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CompanyAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Not authenticated");

        // Get logged-in user's companyId
        const userSnap = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid))
        );
        if (userSnap.empty) throw new Error("User not found");

        const userData = userSnap.docs[0].data();
        const companyId = userData.companyId;

        // Fetch agents belonging to this company
        const agentsSnap = await getDocs(
          query(collection(db, "agents"), where("companyId", "==", companyId))
        );
        setAgents(agentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading agents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (loading) {
    return <p className="p-4">Loading agents...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agents</h1>
      {agents.length > 0 ? (
        <ul className="list-disc pl-6">
          {agents.map((agent) => (
            <li key={agent.id}>{agent.name} — {agent.email}</li>
          ))}
        </ul>
      ) : (
        <p>No agents found.</p>
      )}
    </div>
  );
}