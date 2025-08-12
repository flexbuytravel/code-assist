"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ companies: 0, agents: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest companies
        const companiesRef = collection(db, "companies");
        const companiesSnap = await getDocs(query(companiesRef, orderBy("createdAt", "desc"), limit(5)));
        const companyData = companiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCompanies(companyData);

        // Fetch latest agents
        const agentsRef = collection(db, "agents");
        const agentsSnap = await getDocs(query(agentsRef, orderBy("createdAt", "desc"), limit(5)));
        const agentData = agentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAgents(agentData);

        // Stats
        setStats({
          companies: companiesSnap.size,
          agents: agentsSnap.size
        });
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Companies</p>
          <p className="text-2xl font-bold">{stats.companies}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Agents</p>
          <p className="text-2xl font-bold">{stats.agents}</p>
        </div>
      </div>

      {/* Latest Companies */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl font-semibold">Latest Companies</h2>
          <Link href="/admin/companies" className="text-blue-600 hover:underline">View All</Link>
        </div>
        {companies.length === 0 ? (
          <p className="text-gray-500">No companies found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b">
                  <td className="p-2">{company.name}</td>
                  <td className="p-2">{company.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Latest Agents */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl font-semibold">Latest Agents</h2>
          <Link href="/admin/agents" className="text-blue-600 hover:underline">View All</Link>
        </div>
        {agents.length === 0 ? (
          <p className="text-gray-500">No agents found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b">
                  <td className="p-2">{agent.name}</td>
                  <td className="p-2">{agent.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}