"use client";

import React from "react";

interface Company {
  id: string;
  name: string;
  agentsCount: number;
}

export default function AdminDashboardPage(): JSX.Element {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchCompanies = async (): Promise<void> => {
      try {
        const res = await fetch("/api/admin/companies");
        if (!res.ok) {
          throw new Error(`Failed to fetch companies: ${res.statusText}`);
        }
        const data: Company[] = await res.json();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {loading ? (
        <p>Loading companies...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Company Name</th>
              <th className="px-4 py-2 text-left">Agents</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b">
                <td className="px-4 py-2">{company.name}</td>
                <td className="px-4 py-2">{company.agentsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}