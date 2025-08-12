"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function CustomerDashboardPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "depositPaid" | "expired">("pending");

  const fetchCustomerData = async () => {
    if (!auth.currentUser) return;

    const customerRef = doc(db, "customers", auth.currentUser.uid);
    const snapshot = await getDoc(customerRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      setCustomerData(data);

      if (data.depositPaid) {
        setStatus("depositPaid");
        startCountdown(new Date(data.depositTimestamp), 6 * 30 * 24 * 60 * 60 * 1000);
      } else if (data.claimTimestamp) {
        setStatus("pending");
        startCountdown(new Date(data.claimTimestamp), 48 * 60 * 60 * 1000);
      }
    }
    setLoading(false);
  };

  const startCountdown = (startTime: Date, durationMs: number) => {
    const endTime = startTime.getTime() + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Time expired");
        setStatus("expired");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(days > 0 ? `${days}d ${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
  };

  const markDepositPaid = async () => {
    if (!auth.currentUser) return;
    const customerRef = doc(db, "customers", auth.currentUser.uid);
    await updateDoc(customerRef, {
      depositPaid: true,
      depositTimestamp: new Date().toISOString()
    });
    fetchCustomerData();
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
          {timeLeft && (
            <div style={{ marginTop: "10px" }}>
              <strong>{status === "depositPaid" ? "Time Remaining to Pay Balance:" : "Time Remaining to Pay Deposit:"}</strong> {timeLeft}
            </div>
          )}

          {status === "pending" && timeLeft !== "Time expired" && (
            <button onClick={markDepositPaid}>Pay Deposit (Temp Button)</button>
          )}
          {status === "depositPaid" && timeLeft !== "Time expired" && (
            <button onClick={() => alert("Go to Final Payment")}>Pay Remaining Balance</button>
          )}
          {status === "expired" && <p style={{ color: "red" }}>This package has expired.</p>}
        </div>
      )}
    </div>
  );
}