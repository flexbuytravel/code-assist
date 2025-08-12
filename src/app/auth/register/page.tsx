"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, firestore } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageIdFromLink = searchParams.get("packageId");
  const referralIdFromLink = searchParams.get("referralId");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [packageData, setPackageData] = useState<any>(null);

  // If link contains packageId + referralId, fetch package info
  useEffect(() => {
    const fetchPackage = async () => {
      if (packageIdFromLink && referralIdFromLink) {
        const pkgRef = doc(firestore, "packages", packageIdFromLink);
        const pkgSnap = await getDoc(pkgRef);

        if (pkgSnap.exists()) {
          setPackageData(pkgSnap.data());
        } else {
          setError("Invalid package link");
        }
      }
    };
    fetchPackage();
  }, [packageIdFromLink, referralIdFromLink]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Calculate 48-hour expiry if claiming package
      let expiresAt = null;
      if (packageIdFromLink && referralIdFromLink) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 48);
        expiresAt = expiryDate.toISOString();
      }

      // Save to Firestore
      const customerDoc: any = {
        uid,
        name,
        email,
        phone,
        address,
        role: "customer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (packageIdFromLink && referralIdFromLink && packageData) {
        customerDoc.packageId = packageIdFromLink;
        customerDoc.referralId = referralIdFromLink;
        customerDoc.agentId = packageData.agentId;
        customerDoc.companyId = packageData.companyId;
        customerDoc.expiresAt = expiresAt;
        customerDoc.depositPaid = false;
        customerDoc.fullyPaid = false;
      }

      await setDoc(doc(firestore, "customers", uid), customerDoc);

      router.push("/customer/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {packageIdFromLink && referralIdFromLink && (
          <>
            <input
              type="text"
              value={packageIdFromLink}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
            <input
              type="text"
              value={referralIdFromLink}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}