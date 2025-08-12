"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    packageId: "",
    referralId: "",
  });

  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from link if provided
  useEffect(() => {
    const packageId = searchParams.get("packageId");
    const referralId = searchParams.get("referralId");

    if (packageId && referralId) {
      setFormData({ packageId, referralId });
      setLocked(true);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return; // prevent changes if locked
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoadPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post("/api/packages/claim", {
        packageId: formData.packageId,
        referralId: formData.referralId,
        validateOnly: true,
      });

      // Redirect to register page with params
      router.push(
        `/auth/register?packageId=${encodeURIComponent(
          formData.packageId
        )}&referralId=${encodeURIComponent(formData.referralId)}`
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to validate package");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Claim Your Travel Package</h1>

      <form onSubmit={handleLoadPackage} className="space-y-4">
        <input
          type="text"
          name="packageId"
          placeholder="Package ID"
          value={formData.packageId}
          onChange={handleChange}
          required
          readOnly={locked}
          className={`w-full border px-3 py-2 rounded ${
            locked ? "bg-gray-100" : ""
          }`}
        />
        <input
          type="text"
          name="referralId"
          placeholder="Referral ID"
          value={formData.referralId}
          onChange={handleChange}
          required
          readOnly={locked}
          className={`w-full border px-3 py-2 rounded ${
            locked ? "bg-gray-100" : ""
          }`}
        />

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Load Package
        </button>
      </form>
    </div>
  );
}