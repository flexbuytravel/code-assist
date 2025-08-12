"use client";

import { useState } from "react";
import { createAgentUser } from "@/lib/functions";

export default function CompanyDashboard() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateAgent = async () => {
    if (!email || !name) return alert("Please enter email and agent name.");
    setLoading(true);
    try {
      const res = await createAgentUser(email, name);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error creating agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Company Dashboard</h1>
      <p>Create new agent accounts</p>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="email"
          placeholder="Agent Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Agent Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <button onClick={handleCreateAgent} disabled={loading}>
          {loading ? "Creating..." : "Create Agent"}
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