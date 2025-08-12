"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect } from "react";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [insurance, setInsurance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number>(200); // default deposit

  useEffect(() => {
    if (user) {
      const loadCustomer = async () => {
        const ref = doc(db, "customers", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCustomerId(snap.id);
        }
      };
      loadCustomer();
    }
  }, [user]);

  // Update price dynamically
  useEffect(() => {
    let amount = paymentType === "deposit" ? 200 : 1000;
    if (insurance) {
      amount += paymentType === "deposit" ? 200 : 600;
    }
    setPrice(amount);
  }, [paymentType, insurance]);

  const handlePayment = async () => {
    if (!customerId) {
      alert("Customer not found.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, paymentType, insurance }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert("Unable to start checkout session.");
      }
    } catch (err) {
      console.error(err);
      alert("Payment error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      <p className="mb-2">
        Choose your payment option and trip insurance before checkout.
      </p>

      <div className="mb-4">
        <label className="block font-medium">Payment Type</label>
        <select
          value={paymentType}
          onChange={(e) =>
            setPaymentType(e.target.value as "deposit" | "full")
          }
          className="border rounded p-2 w-full"
        >
          <option value="deposit">Deposit ($200)</option>
          <option value="full">Full Payment ($1000)</option>
        </select>
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          checked={insurance}
          onChange={() => setInsurance(!insurance)}
          className="mr-2"
        />
        <label>Trip Insurance (+${paymentType === "deposit" ? 200 : 600})</label>
      </div>

      <div className="mb-4">
        <p className="font-bold">Total: ${price}</p>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Proceed to Payment"}
      </button>
    </div>
  );
}