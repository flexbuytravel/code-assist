"use client";

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase"; // Adjust path if different
import { useAuth } from "@/hooks/useAuth"; // Must provide { user }

export default function CreateCompanyPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("❌ You must be signed in as an admin to create a company.");
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
      const createCompanyFn = httpsCallable(functions, "createCompany"); // Backend must set role & create Firestore doc

      await createCompanyFn({
        name,
        email,
        password,
        role: "company" // ✅ explicit role
      });

      setMessage("✅ Company created successfully!");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Error creating company:", err);
      setMessage(`❌ ${err.message || "Failed to create company."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Company</h1>
      <form onSubmit={handleCreateCompany} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Company Name</label>
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Company"}
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