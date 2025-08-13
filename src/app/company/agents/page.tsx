"use client";

import React from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function CompanyAgentsPage(): JSX.Element {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchCompanyAgents = async (): Promise<void> => {
    try {
      const res = await fetch("/api/company/agents");
      if (!res.ok) {
        throw new Error(`Failed to fetch agents: ${res.statusText}`);
      }
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching company agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this agent? The agent's packages will remain attached to your company.")) {
      return;
    }
    try {
      const res = await fetch(`/api/company/agents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Failed to delete agent: ${res.statusText}`);
      }
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  React.useEffect(() => {
    fetchCompanyAgents();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Company’s Agents</h1>
      {loading ? (
        <p>Loading agents...</p>
      ) : agents.length === 0 ? (
        <p>No agents found for your company.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded shadow">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b">
                <td className="px-4 py-2">{agent.name}</td>
                <td className="px-4 py-2">{agent.email}</td>
                <td className="px-4 py-2">{new Date(agent.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 space-x-2">
                  <Link
                    href={`/company/agents/${agent.id}`}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}