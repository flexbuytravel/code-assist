"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // Your auth hook

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    packageId: "",
    referralId: "",
  });

  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prefill from link if present
  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralId");
    if (pkg && ref) {
      setFormData((prev) => ({
        ...prev,
        packageId: pkg,
        referralId: ref,
      }));
      setFieldsLocked(true);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.packageId || !formData.referralId) {
      alert("Package ID and Referral ID are required.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create Firebase Auth user if not already logged in
      let uid = user?.uid;
      if (!uid) {
        const resAuth = await fetch("/api/createAuthUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        const authData = await resAuth.json();
        if (!resAuth.ok) throw new Error(authData.error || "Auth creation failed");
        uid = authData.uid;
      }

      // Step 2: Call registerCustomer API
      const res = await fetch("/api/registerCustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          packageId: formData.packageId,
          referralId: formData.referralId,
          depositAmount: 100, // Default or get from package info
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push("/customer/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Claim Your Travel Package</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="packageId"
          placeholder="Package ID"
          value={formData.packageId}
          onChange={handleChange}
          disabled={fieldsLocked}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="referralId"
          placeholder="Referral ID"
          value={formData.referralId}
          onChange={handleChange}
          disabled={fieldsLocked}
          required
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register & Claim"}
        </button>
      </form>
    </div>
  );
}