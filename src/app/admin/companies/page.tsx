"use client";

import React from "react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  email: string;
  totalAgents: number;
  createdAt: string;
}

export default function AdminCompaniesPage(): JSX.Element {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

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

  const deleteCompany = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this company? This will also remove all its agents.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Failed to delete company: ${res.statusText}`);
      }
      setCompanies((prev) => prev.filter((company) => company.id !== id));
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  React.useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Companies</h1>
      {loading ? (
        <p>Loading companies...</p>
      ) : companies.length === 0 ? (
        <p>No companies found.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded shadow">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2