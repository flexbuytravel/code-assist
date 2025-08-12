"use client";

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase"; // Adjust path if different
import { useAuth } from "@/hooks/useAuth"; // Must provide { user }

export default function CreateAgentPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("❌ You must be signed in as a company to create an agent.");
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("❌ All fields are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions(app);
      const createAgentFn = httpsCallable(functions, "createAgent"); // Make sure backend function exists

      await createAgentFn({
        name,
        email,
        password,
        companyId: user.uid // ✅ Attach companyId explicitly
      });

      setMessage("✅ Agent created successfully!");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Error creating agent:", err);
      setMessage(`❌ ${err.message || "Failed to create agent."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Agent</h1>
      <form onSubmit={handleCreateAgent} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Email</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Agent"}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          {message}
        </div>
      )}
    </div>
  );
}