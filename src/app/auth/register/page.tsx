"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (packageIdFromLink || referralIdFromLink) {
      setFormData((prev) => ({
        ...prev,
        packageId: packageIdFromLink,
        referralId: referralIdFromLink,
      }));
    }
  }, [packageIdFromLink, referralIdFromLink]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone || !formData.address) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Validate package before creating account
      const res = await fetch("/api/customer/package/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: formData.packageId,
          referralId: formData.referralId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Package validation failed");

      // Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Save user details in Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: "customer",
        packageId: formData.packageId,
        referralId: formData.referralId,
        createdAt: new Date(),
      });

      toast.success("Registration successful!");
      router.push("/customer/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="input input-bordered w-full"
        />

        <input
          type="text"
          name="packageId"
          placeholder="Package ID"
          value={formData.packageId}
          onChange={handleChange}
          readOnly={!!packageIdFromLink}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          name="referralId"
          placeholder="Referral ID"
          value={formData.referralId}
          onChange={handleChange}
          readOnly={!!referralIdFromLink}
          className="input input-bordered w-full"
        />

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}