"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const packageId = searchParams.get("packageId") || "";
  const referralId = searchParams.get("referralId") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRegister = async () => {
    try {
      // Create auth account
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Save customer to Firestore with timerStart
      await setDoc(doc(db, "customers", cred.user.uid), {
        ...form,
        uid: cred.user.uid,
        packageId,
        referralId,
        timerStart: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      alert("Registration successful! Redirecting to dashboard...");
      router.push("/customer/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>
      <h1>Customer Registration</h1>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <input
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        placeholder="Package ID"
        value={packageId}
        readOnly
      />
      <input
        placeholder="Referral ID"
        value={referralId}
        readOnly
      />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}