"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Pre-fill from query params if coming from Load Package
  const prefilledPackageId = searchParams.get("packageId") || "";
  const prefilledReferral = searchParams.get("referralCode") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    packageId: prefilledPackageId,
    referralCode: prefilledReferral,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Client-side validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone || !formData.address || !formData.packageId) {
      setError("All fields are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Redirect to customer dashboard after successful registration
      router.push("/customer/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {error && <div className="bg-red-100 text-red-600 p-2 mb-4 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-600 p-2 mb-4 rounded">Registration successful!</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="address"
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          name="packageId"
          type="text"
          placeholder="Package ID"
          value={formData.packageId}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          readOnly={!!prefilledPackageId}
        />
        <input
          name="referralCode"
          type="text"
          placeholder="Referral Code"
          value={formData.referralCode}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          readOnly={!!prefilledReferral}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}