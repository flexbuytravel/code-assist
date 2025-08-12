"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Not authenticated");

        const custSnap = await getDocs(
          query(collection(db, "customers"), where("uid", "==", uid))
        );
        if (custSnap.empty) throw new Error("Customer not found");

        const custData = custSnap.docs[0].data();
        setCustomer(custData);

        // Countdown setup
        const expiry = custData.expiresAt.toDate ? custData.expiresAt.toDate() : custData.expiresAt;
        const updateTimer = () => {
          const now = new Date();
          const diff = expiry - now;
          if (diff <= 0) {
            setTimeLeft("Expired");
            return;
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 60000); // every minute
        return () => clearInterval(timerInterval);

      } catch (err) {
        console.error("Error loading customer dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, []);

  const handlePayDeposit = async () => {
    try {
      const res = await fetch("/api/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          packageId: customer.packageId
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error starting checkout:", err);
    }
  };

  if (loading) return <p className="p-4">Loading dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>
      {customer && (
        <>
          <p><strong>Package ID:</strong> {customer.packageId}</p>
          <p><strong>Referral ID:</strong> {customer.referralId}</p>
          <p><strong>Deposit Paid:</strong> {customer.depositPaid ? "Yes" : "No"}</p>
          <p><strong>Time Left:</strong> {timeLeft}</p>

          {!customer.depositPaid && (
            <button
              onClick={handlePayDeposit}
              className="bg-green-600 text-white px-4 py-2 rounded mt-4"
            >
              Pay Deposit
            </button>
          )}
        </>
      )}
    </div>
  );
}