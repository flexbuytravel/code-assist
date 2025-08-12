"use client";

import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearchParams, useRouter } from "next/navigation";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const referralIdParam = searchParams.get("referralId");
  const packageIdParam = searchParams.get("packageId");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralId: referralIdParam || "",
    packageId: packageIdParam || ""
  });

  const [lockedFields, setLockedFields] = useState(false);

  useEffect(() => {
    if (referralIdParam && packageIdParam) {
      setLockedFields(true);
    }
  }, [referralIdParam, packageIdParam]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const uid = userCred.user.uid;

      // Get package details
      const pkgSnap = await getDoc(doc(db, "packages", formData.packageId));
      if (!pkgSnap.exists()) throw new Error("Package not found");
      const pkgData = pkgSnap.data();

      // Create customer doc
      await addDoc(collection(db, "customers"), {
        uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        packageId: formData.packageId,
        referralId: formData.referralId,
        companyId: pkgData.companyId,
        agentId: pkgData.agentId,
        depositPaid: false,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      });

      router.push("/customer/dashboard");
    } catch (err) {
      console.error("Error registering customer:", err);
      alert("Error registering. See console for details.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Claim Your Package</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="border p-2 w-full" required />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 w-full" required />
        <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="border p-2 w-full" required />
        <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="border p-2 w-full" required />
        <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="border p-2 w-full" required />

        <input
          name="referralId"
          placeholder="Referral ID"
          value={formData.referralId}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={lockedFields}
          required
        />
        <input
          name="packageId"
          placeholder="Package ID"
          value={formData.packageId}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={lockedFields}
          required
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register & Claim</button>
      </form>
    </div>
  );
}