"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [agents, setAgents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Not authenticated");

        // Get logged-in user's companyId
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid))
        );
        if (userDoc.empty) throw new Error("User not found");

        const userData = userDoc.docs[0].data();
        const companyId = userData.companyId;

        // Fetch company document
        const companyDoc = await getDocs(
          query(collection(db, "companies"), where("id", "==", companyId))
        );
        if (!companyDoc.empty) {
          setCompany(companyDoc.docs[0].data());
        }

        // Fetch agents for this company
        const agentsSnap = await getDocs(
          query(collection(db, "agents"), where("companyId", "==", companyId))
        );
        setAgents(agentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        // Fetch packages for this company
        const packagesSnap = await getDocs(
          query(collection(db, "packages"), where("companyId", "==", companyId))
        );
        setPackages(packagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Error loading company dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  if (loading) {
    return <p className="p-4">Loading company dashboard...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Company Dashboard</h1>

      {company && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="font-bold text-lg">{company.name}</h2>
          <p>{company.email}</p>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-3">Agents</h2>
      {agents.length > 0 ? (
        <ul className="list-disc pl-6">
          {agents.map((agent) => (
            <li key={agent.id}>{agent.name} — {agent.email}</li>
          ))}
        </ul>
      ) : (
        <p>No agents found.</p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-3">Packages</h2>
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