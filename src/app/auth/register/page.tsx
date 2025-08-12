"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const packageIdFromQuery = searchParams.get("packageId") || "";
  const referralCodeFromQuery = searchParams.get("referralCode") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    packageId: packageIdFromQuery,
    referralCode: referralCodeFromQuery,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (packageIdFromQuery && referralCodeFromQuery) {
      setForm((prev) => ({
        ...prev,
        packageId: packageIdFromQuery,
        referralCode: referralCodeFromQuery,
      }));
    }
  }, [packageIdFromQuery, referralCodeFromQuery]);

  const handleRegister = async () => {
    setError("");

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }

      // Registration successful — redirect or show success
      alert("Registration successful!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Register</h1>
      <input
        type="text"
        placeholder="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
      />
      <input
        type="text"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <input
        type="text"
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        type="text"
        placeholder="Package ID"
        value={form.packageId}
        disabled
      />
      <input
        type="text"
        placeholder="Referral Code"
        value={form.referralCode}
        disabled
      />
      <button onClick={handleRegister}>Register</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}