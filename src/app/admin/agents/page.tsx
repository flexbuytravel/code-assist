
"use client";

import React from "react";

interface Agent {
  id: string;
  name: string;
  email: string;
  companyName: string;
}

export default function AdminAgentsPage(): JSX.Element {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchAgents = async (): Promise<void> => {
    try {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) {
        throw new Error(`Failed to fetch agents: ${res.statusText}`);
      }
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete agent: ${res.statusText}`);
      }
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  React.useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agents</h1>
      {loading ? (
        <p>Loading agents...</p>
      ) : agents.length === 0 ? (
        <p>No agents found.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b">
                <td className="px-4 py-2">{agent.name}</td>
                <td className="px-4 py-2">{agent.email}</td>
                <td className="px-4 py-2">{agent.companyName}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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