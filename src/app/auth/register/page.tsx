"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const auth = getAuth(app);
  const db = getFirestore(app);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [packageId, setPackageId] = useState("");
  const [referralId, setReferralId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from query params
  useEffect(() => {
    const pkg = searchParams.get("packageId");
    const ref = searchParams.get("referralId");

    if (pkg) setPackageId(pkg);
    if (ref) setReferralId(ref);
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await updateProfile(user, { displayName: name });

      // Fetch package to link customer to company
      let companyId = null;
      if (packageId) {
        const pkgRef = doc(db, "packages", packageId);
        const pkgSnap = await getDoc(pkgRef);

        if (!pkgSnap.exists()) {
          throw new Error("Package not found.");
        }

        const pkgData = pkgSnap.data();
        companyId = pkgData.companyId || null;

        // Attach claimTimestamp to package
        await updateDoc(pkgRef, {
          claimedBy: user.uid,
          claimTimestamp: new Date().toISOString()
        });
      }

      // Create customer record with 48h default
      await setDoc(doc(db, "customers", user.uid), {
        name,
        email,
        phone,
        address,
        packageId: packageId || null,
        referralId: referralId || null,
        companyId: companyId || null,
        deletedAgent: false,
        depositPaid: false,
        depositTimestamp: null,
        claimTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      router.push("/customer/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <input type="text" placeholder="Package ID" value={packageId} onChange={(e) => setPackageId(e.target.value)} readOnly={!!searchParams.get("packageId")} />
        <input type="text" placeholder="Referral ID" value={referralId} onChange={(e) => setReferralId(e.target.value)} readOnly={!!searchParams.get("referralId")} />
        <button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
      </form>
    </div>
  );
}