"use client";

import { useState } from "react";
import { createPackage } from "@/lib/functions";

export default function AgentDashboard() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreatePackage = async () => {
    if (!name || !price) return alert("Please enter package name and price.");
    setLoading(true);
    try {
      const res = await createPackage(name, description, price);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error creating package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Agent Dashboard</h1>
      <p>Create new travel packages</p>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Package Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        <button onClick={handleCreatePackage} disabled={loading}>
          {loading ? "Creating..." : "Create Package"}
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