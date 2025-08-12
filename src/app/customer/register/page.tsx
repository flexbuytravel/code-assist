"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageIdFromLink = searchParams.get("packageId") || "";
  const referralIdFromLink = searchParams.get("referralId") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    packageId: packageIdFromLink,
    referralId: referralIdFromLink
  });

  const lockedFields = Boolean(packageIdFromLink && referralIdFromLink);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        role: "customer",
        packageId: form.packageId,
        referralId: form.referralId,
        packageClaimedAt: Date.now()
      });
      router.push("/customer/dashboard");
    } catch {
      setError("Registration failed.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customer Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="border p-2 w-full" required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 w-full" required />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className="border p-2 w-full" required />
        <input type="text" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="border p-2 w-full" />
        <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} className="border p-2 w-full" />

        <input type="text" name="packageId" placeholder="Package ID" value={form.packageId} onChange={handleChange} readOnly={lockedFields} className={`border p-2 w-full ${lockedFields ? "bg-gray-100" : ""}`} />
        <input type="text" name="referralId" placeholder="Referral ID" value={form.referralId} onChange={handleChange} readOnly={lockedFields} className={`border p-2 w-full ${lockedFields ? "bg-gray-100" : ""}`} />

        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
      </form>
    </div>
  );
}