"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase"; // Your Firebase client init

const auth = getAuth(app);
const db = getFirestore(app);

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    packageId: "",
    referralCode: "",
  });
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill and lock package/referral fields
  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralCode");

    if (pkg) {
      setFormData((prev) => ({ ...prev, packageId: pkg }));
      loadPackage(pkg, ref || "");
    }
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  const loadPackage = async (pkgId: string, refCode: string) => {
    try {
      const packageRef = doc(db, "packages", pkgId);
      const snap = await getDoc(packageRef);
      if (!snap.exists()) {
        setError("Package not found.");
        return;
      }
      const data = snap.data();
      if (data.referralCode !== refCode) {
        setError("Invalid referral code for this package.");
        return;
      }
      setPackageData(data);
    } catch (err) {
      console.error(err);
      setError("Error loading package details.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    setError("");

    if (!formData.email || !formData.password || !formData.name) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Create Firebase Auth account
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Save user document
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        packageId: formData.packageId,
        referralCode: formData.referralCode,
        role: "customer",
        createdAt: serverTimestamp(),
      });

      // Optional: mark package as claimed
      await setDoc(
        doc(db, "packages", formData.packageId),
        {
          claimedBy: userCred.user.uid,
          claimedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/customer/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error registering user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <label className="block mb-2 font-semibold">Name</label>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <label className="block mb-2 font-semibold">Email</label>
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <label className="block mb-2 font-semibold">Password</label>
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <label className="block mb-2 font-semibold">Phone Number</label>
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <label className="block mb-2 font-semibold">Address</label>
      <input
        name="address"
        value={formData.address}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <label className="block mb-2 font-semibold">Package ID</label>
      <input
        name="packageId"
        value={formData.packageId}
        readOnly
        className="w-full border rounded px-3 py-2 mb-4 bg-gray-100 text-gray-500"
      />

      <label className="block mb-2 font-semibold">Referral Code</label>
      <input
        name="referralCode"
        value={formData.referralCode}
        readOnly
        className="w-full border rounded px-3 py-2 mb-4 bg-gray-100 text-gray-500"
      />

      {packageData && (
        <div className="border p-4 rounded mb-4">
          <h2 className="text-lg font-semibold">{packageData.title}</h2>
          <p>{packageData.description}</p>
          <p className="font-bold">Price: ${packageData.price?.toFixed(2)}</p>
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </div>
  );
}