"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const customerId = "CURRENT_CUSTOMER_ID"; // TODO: replace with logged-in customer ID from auth context

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customerRef = doc(firestore, "customers", customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
          setCustomer(customerSnap.data());
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  // Countdown logic
  useEffect(() => {
    if (!customer) return;

    const targetDate = new Date(customer.expiresAt);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [customer]);

  const handlePayDeposit = async () => {
    if (!customer?.packageId) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: customer.packageId,
          customerId,
        }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url; // redirect to Stripe
      } else {
        alert(data.message || "Error creating checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Payment failed to start.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!customer) {
    return <p>No customer data found.</p>;
  }

  return (
    <div>
      <h1>Welcome, {customer.name}</h1>
      <h2>Package ID: {customer.packageId}</h2>

      {customer.depositPaid ? (
        <div>
          <p>Your deposit is confirmed ✅</p>
          <p>Time left until package expires: {timeLeft}</p>
        </div>
      ) : (
        <div>
          <p>Please pay your deposit within:</p>
          <p>{timeLeft}</p>
          <button
            className="btn"
            onClick={handlePayDeposit}
            disabled={processing}
          >
            {processing ? "Processing..." : "Pay Deposit"}
          </button>
        </div>
      )}
    </div>
  );
}