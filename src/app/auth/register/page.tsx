"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { validateEmail, validatePassword } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageIdFromLink = searchParams.get("packageId") || "";
  const referralIdFromLink = searchParams.get("referralId") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    packageId: packageIdFromLink,
    referralId: referralIdFromLink,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email format.";
    if (!validatePassword(formData.password))
      newErrors.password = "Password must be at least 8 characters, include an uppercase letter and a number.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!/^\+?\d{10,15}$/.test(formData.phone))
      newErrors.phone = "Phone must be 10–15 digits.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.packageId.trim()) newErrors.packageId = "Package ID is required.";
    if (!formData.referralId.trim()) newErrors.referralId = "Referral ID is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        packageId: formData.packageId,
        referralId: formData.referralId,
        role: "customer",
        createdAt: new Date(),
      });

      router.push("/customer/dashboard");
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {errors.general && <p className="text-red-500">{errors.general}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.name && <p className="text-red-500">{errors.name}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.password && <p className="text-red-500">{errors.password}</p>}

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword}</p>}

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.phone && <p className="text-red-500">{errors.phone}</p>}

        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.address && <p className="text-red-500">{errors.address}</p>}

        <input
          type="text"
          name="packageId"
          placeholder="Package ID"
          value={formData.packageId}
          onChange={handleChange}
          readOnly={!!packageIdFromLink}
          className={`w-full p-2 border rounded ${packageIdFromLink ? "bg-gray-100" : ""}`}
        />
        {errors.packageId && <p className="text-red-500">{errors.packageId}</p>}

        <input
          type="text"
          name="referralId"
          placeholder="Referral ID"
          value={formData.referralId}
          onChange={handleChange}
          readOnly={!!referralIdFromLink}
          className={`w-full p-2 border rounded ${referralIdFromLink ? "bg-gray-100" : ""}`}
        />
        {errors.referralId && <p className="text-red-500">{errors.referralId}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}