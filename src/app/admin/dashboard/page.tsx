"use client";

import React from "react";

interface Stats {
  totalCompanies: number;
  totalAgents: number;
  totalPackages: number;
  totalCustomers: number;
}

export default function AdminDashboardPage(): JSX.Element {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchStats = async (): Promise<void> => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.statusText}`);
      }
      const data: Stats = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {loading ? (
        <p>Loading dashboard...</p>
      ) : !stats ? (
        <p>No data available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Companies</h2>
            <p className="text-2xl">{stats.totalCompanies}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Agents</h2>
            <p className="text-2xl">{stats.totalAgents}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Packages</h2>
            <p className="text-2xl">{stats.totalPackages}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Customers</h2>
            <p className="text-2xl">{stats.totalCustomers}</p>
          </div>
        </div>
      )}
    </div>
  );
}