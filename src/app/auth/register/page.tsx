"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    packageId: "",
    referralId: "",
  });

  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load package details from API
  useEffect(() => {
    const packageId = searchParams.get("packageId");
    const referralId = searchParams.get("referralId");

    if (!packageId || !referralId) {
      setError("Package and referral details are required.");
      setLoading(false);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      packageId,
      referralId,
    }));

    const validatePackage = async () => {
      try {
        const res = await axios.post("/api/packages/claim", {
          packageId,
          referralId,
        });
        setPackageInfo(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    validatePackage();
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await axios.post("/api/auth/register", formData);
      router.push("/customer/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  if (loading) return <p>Loading package details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Register & Claim Package</h1>

      {packageInfo && (
        <div className="mb-4 p-3 border rounded bg-gray-50">
          <p><strong>Package ID:</strong> {packageInfo.packageId}</p>
          <p><strong>Referral ID:</strong> {packageInfo.referralId}</p>
          <p><strong>Price:</strong> ${packageInfo.price}</p>
          <p><strong>Trips:</strong> {packageInfo.trips}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 8 chars)"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="text"
          name="packageId"
          value={formData.packageId}
          readOnly
          className="w-full border px-3 py-2 rounded bg-gray-100"
        />
        <input
          type="text"
          name="referralId"
          value={formData.referralId}
          readOnly
          className="w-full border px-3 py-2 rounded bg-gray-100"
        />

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Register & Claim
        </button>
      </form>
    </div>
  );
}