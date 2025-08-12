"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, functions } from "@/lib/firebase";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import Image from "next/image";

export default function RegisterCustomerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const packageId = searchParams.get("packageId") || "";
  const referralId = searchParams.get("referralId") || "";

  const [pkgData, setPkgData] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load package data on mount
  useEffect(() => {
    if (!packageId) {
      setError("No package ID provided.");
      return;
    }
    (async () => {
      try {
        const pkgRef = doc(db, "packages", packageId);
        const pkgSnap = await getDoc(pkgRef);
        if (pkgSnap.exists()) {
          const data = pkgSnap.data();
          if (data.claimedBy) {
            setError("This package is already claimed.");
          } else {
            setPkgData(data);
          }
        } else {
          setError("Package not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading package.");
      }
    })();
  }, [packageId]);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.address) {
      setError("All fields are required.");
      return;
    }
    if (!pkgData) {
      setError("Package data not loaded or package unavailable.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create Firebase Auth account
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCred.user.uid;

      // Create customer document linked to package/agent/company
      await setDoc(doc(db, "customers", uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        packageId,
        referralId: referralId || null,
        agentId: pkgData.agentId || null,
        companyId: pkgData.companyId || null,
        createdAt: new Date()
      });

      // Call backend to claim the package
      const claimFn = httpsCallable(functions, "claimPackage");
      await claimFn({ packageId });

      // Create Stripe Checkout session
      const checkoutFn = httpsCallable(functions, "createCheckoutSession");
      const sessionRes: any = await checkoutFn({ packageId });
      const sessionId = sessionRes.data.id;

      if (!sessionId) throw new Error("Failed to create checkout session.");

      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Image src="/logo2.png" alt="FlexBuy Logo" width={150} height={150} className="mb-6" />
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Register to Claim Package</h1>

        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}

        <label className="block mb-2 font-medium">Package ID</label>
        <input type="text" value={packageId} disabled className="border rounded p-2 w-full mb-4 bg-gray-100" />

        <label className="block mb-2 font-medium">Referral ID</label>
        <input type="text" value={referralId} disabled className="border rounded p-2 w-full mb-4 bg-gray-100" />

        <label className="block mb-2 font-medium">Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded p-2 w-full mb-4"
        />

        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border rounded p-2 w-full mb-4"
        />

        <label className="block mb-2 font-medium">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border rounded p-2 w-full mb-4"
        />

        <label className="block mb-2 font-medium">Phone Number</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border rounded p-2 w-full mb-4"
        />

        <label className="block mb-2 font-medium">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="border rounded p-2 w-full mb-4"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
        >
          {loading ? "Registering..." : "Register & Pay"}
        </button>
      </div>
    </div>
  );
}