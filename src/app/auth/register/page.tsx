"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { assignRole } from "@/lib/roles";

export default function RegisterPage() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [packageId, setPackageId] = useState("");
  const [referralId, setReferralId] = useState("");

  useEffect(() => {
    const pkgParam = searchParams.get("packageId");
    const refParam = searchParams.get("referralId");

    if (pkgParam) setPackageId(pkgParam);
    if (refParam) setReferralId(refParam);
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await assignRole(user.uid, "customer");
      await setDoc(doc(db, "customers", user.uid), {
        name,
        email,
        phone,
        address,
        packageId,
        referralId,
        claimedAt: serverTimestamp(),
      });

      router.push("/customer/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <input
          type="text"
          placeholder="Full Name"
          className="w-full border p-2 rounded mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="w-full border p-2 rounded mb-4"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Address"
          className="w-full border p-2 rounded mb-4"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Package ID"
          className="w-full border p-2 rounded mb-4"
          value={packageId}
          disabled={!!searchParams.get("packageId")}
          onChange={(e) => setPackageId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Referral ID"
          className="w-full border p-2 rounded mb-4"
          value={referralId}
          disabled={!!searchParams.get("referralId")}
          onChange={(e) => setReferralId(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        >
          Register
        </button>
      </form>
    </div>
  );
}