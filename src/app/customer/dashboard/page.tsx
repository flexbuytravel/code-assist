"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function CustomerDashboardPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    if (!auth.currentUser) return;

    const customerRef = doc(db, "customers", auth.currentUser.uid);
    const snapshot = await getDoc(customerRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      setCustomerData(data);

      if (data.claimTimestamp) {
        startCountdown(new Date(data.claimTimestamp));
      }
    }
    setLoading(false);
  };

  // Countdown logic
  const startCountdown = (claimTime: Date) => {
    const endTime = claimTime.getTime() + 48 * 60 * 60 * 1000; // +48 hours

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Time expired");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
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

          {timeLeft && (
            <div style={{ marginTop: "10px" }}>
              <strong>Time Remaining to Purchase:</strong> {timeLeft}
            </div>
          )}
        </div>
      )}
    </div>
  );
}