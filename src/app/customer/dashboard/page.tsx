"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const ref = doc(firestore, "customers", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCustomerData(data);

        if (data.fullyPaid) {
          // Full payment - no countdown
          setTimeLeft(null);
        } else if (data.expiresAt) {
          const expiry = new Date(data.expiresAt).getTime();
          setTimeLeft(Math.max(0, expiry - Date.now()));
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Countdown tick
  useEffect(() => {
    if (timeLeft === null) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev > 1000) return prev - 1000;
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  if (loading) return <p>Loading dashboard...</p>;

  if (!customerData) return <p>No customer data found.</p>;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {customerData.fullyPaid ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Your package is fully paid. Thank you!
        </div>
      ) : customerData.depositPaid ? (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Deposit paid. Time remaining to complete purchase:{" "}
          <strong>{timeLeft !== null ? formatTime(timeLeft) : "Loading..."}</strong>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please complete payment within:{" "}
          <strong>{timeLeft !== null ? formatTime(timeLeft) : "Loading..."}</strong>
        </div>
      )}
    </div>
  );
}