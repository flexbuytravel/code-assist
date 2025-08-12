"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();

  const [packageId, setPackageId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [locked, setLocked] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralCode");

    if (pkg && ref) {
      setPackageId(pkg);
      setReferralCode(ref);
      setLocked(true);
    }
  }, [searchParams]);

  const handleRegister = async () => {
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });

      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        phone,
        address,
        role: "customer",
        packageId,
        referralCode,
        createdAt: new Date().toISOString(),
      });

      // Verify package exists before redirect
      const pkgDoc = await getDoc(doc(db, "packages", packageId));
      if (!pkgDoc.exists()) {
        alert("Package not found");
        return;
      }

      router.push("/customer/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      <div className="mb-4">
        <label>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Package ID</label>
        <input
          type="text"
          value={packageId}
          readOnly={locked}
          onChange={(e) => setPackageId(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label>Referral Code</label>
        <input
          type="text"
          value={referralCode}
          readOnly={locked}
          onChange={(e) => setReferralCode(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleRegister}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Register
      </button>
    </div>
  );
}