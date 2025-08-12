"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function CustomerDashboardPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomerData = async () => {
    if (!auth.currentUser) return;

    const customerRef = doc(db, "customers", auth.currentUser.uid);
    const snapshot = await getDoc(customerRef);

    if (snapshot.exists()) {
      setCustomerData(snapshot.data());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomerData();
  }, [auth.currentUser]);

  if (loading) return <p>Loading dashboard...</p>;

  if (!customerData) return <p>No customer data found.</p>;

  return (
    <div>
      <h1>Customer Dashboard</h1>
      <p>Name: {customerData.name}</p>
      <p>Email: {customerData.email}</p>

      {customerData.packageId && (
        <div>
          <h2>Package Details</h2>
          <p>Package ID: {customerData.packageId}</p>
          <p>Price: ${customerData.packagePrice}</p>
          {customerData.agentId ? (
            <p>Agent: {customerData.agentName || customerData.agentId}</p>
          ) : customerData.deletedAgent ? (
            <p>Agent: [Deleted]</p>
          ) : (
            <p>Agent: [Unassigned]</p>
          )}
        </div>
      )}
    </div>
  );
}