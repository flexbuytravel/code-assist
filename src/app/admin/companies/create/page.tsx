"use client";

import { useState, useEffect } from "react";
import { assignRole } from "@/lib/roles";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleCreateCompany = async () => {
    try {
      // Create auth account
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Save company to Firestore
      await addDoc(collection(db, "companies"), {
        name: form.name,
        email: form.email,
        uid: cred.user.uid,
        createdAt: new Date(),
      });

      // Assign role via new helper
      await assignRole(cred.user.uid, "company");

      alert("Company account created successfully!");
      setForm({ name: "", email: "", password: "" });
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div>
      <h1>Companies</h1>
      <input
        placeholder="Company Name"
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
      <button onClick={handleCreateCompany}>Create Company</button>
    </div>
  );
}