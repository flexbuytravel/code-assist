"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function AdminCompaniesPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all companies
  const fetchCompanies = async () => {
    const companiesRef = collection(db, "companies");
    const snapshot = await getDocs(companiesRef);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setCompanies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Safe-delete company with agent + package cleanup
  const deleteCompany = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company? All its agents will be removed, but packages will remain linked to the company.")) {
      return;
    }

    try {
      // Step 1: Find all agents in this company
      const agentsRef = collection(db, "agents");
      const agentsQuery = query(agentsRef, where("companyId", "==", companyId));
      const agentsSnapshot = await getDocs(agentsQuery);

      // Step 2: For each agent, clean up packages
      for (const agentDoc of agentsSnapshot.docs) {
        const agentId = agentDoc.id;

        // Find packages linked to this agent
        const packagesRef = collection(db, "packages");
        const pkgQuery = query(packagesRef, where("agentId", "==", agentId));
        const pkgSnapshot = await getDocs(pkgQuery);

        // Nullify agentId but keep companyId
        for (const pkg of pkgSnapshot.docs) {
          await updateDoc(pkg.ref, {
            agentId: null,
            deletedAgent: true
          });
        }

        // Delete the agent document
        await deleteDoc(doc(db, "agents", agentId));
      }

      // Step 3: Delete the company document
      await deleteDoc(doc(db, "companies", companyId));

      // Step 4: Update UI
      setCompanies(prev => prev.filter(company => company.id !== companyId));

      alert("Company and its agents deleted successfully. Packages remain linked to the company.");
    } catch (err) {
      console.error("Error deleting company:", err);
      alert("Error deleting company. Please try again.");
    }
  };

  if (loading) return <p>Loading companies...</p>;

  return (
    <div>
      <h1>Admin Companies</h1>
      {companies.length === 0 && <p>No companies found.</p>}
      <ul>
        {companies.map(company => (
          <li key={company.id}>
            {company.name} ({company.email})
            <button onClick={() => deleteCompany(company.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}