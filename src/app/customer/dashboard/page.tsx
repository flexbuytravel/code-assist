"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);

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

    const targetDate = customer.depositPaid
      ? new Date(customer.expiresAt) // 6 months from deposit
      : new Date(customer.expiresAt); // 48 hours from registration

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
          <a
            href={`/checkout?packageId=${customer.packageId}&customerId=${customerId}`}
            className="btn"
          >
            Pay Deposit
          </a>
        </div>
      )}
    </div>
  );
}