"use client";

import { useState } from "react";
import { createCompanyUser } from "@/lib/functions";

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateCompany = async () => {
    if (!email || !name) return alert("Please enter email and company name.");
    setLoading(true);
    try {
      const res = await createCompanyUser(email, name);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error creating company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Dashboard</h1>
      <p>Create new company accounts</p>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="email"
          placeholder="Company Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Company Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <button onClick={handleCreateCompany} disabled={loading}>
          {loading ? "Creating..." : "Create Company"}
        </button>
      </div>

      {result && (
        <pre style={{ marginTop: "1rem", background: "#f5f5f5", padding: "1rem" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}