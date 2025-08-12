"use client";

import { useState } from "react";
import { assignRole } from "@/lib/roles";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function CreateAgentPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleCreateAgent = async () => {
    try {
      // Create agent's Auth account
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Save to Firestore
      await addDoc(collection(db, "agents"), {
        name: form.name,
        email: form.email,
        uid: cred.user.uid,
        createdAt: new Date(),
      });

      // Assign role via new helper
      await assignRole(cred.user.uid, "agent");

      alert("Agent created successfully!");
      setForm({ name: "", email: "", password: "" });
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div>
      <h1>Create Agent</h1>
      <input
        placeholder="Agent Name"
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
      <button onClick={handleCreateAgent}>Create Agent</button>
    </div>
  );
}