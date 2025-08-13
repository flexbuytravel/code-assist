"use client";

import { useState, useEffect } from "react";

export default function PaymentPage({ params }: { params: { customerId: string } }) {
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [insurance, setInsurance] = useState(false);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Load customer base price (from Firestore emulator in dev mode)
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customer/${params.customerId}`);
        if (res.ok) {
          const data = await res.json();
          setBasePrice(data.fullPrice);
        }
      } catch (err) {
        console.error("Error loading customer:", err);
      }
    }
    fetchCustomer();
  }, [params.customerId]);

  const totalPrice = () => {
    if (paymentType === "deposit") {
      return insurance ? 200 + 200 : 200; // deposit doubles trips if insurance checked
    }
    if (paymentType === "full") {
      let price = basePrice;
      if (insurance) price *= 2; // doubles trips with insurance
      return price;
    }
    return 0;
  };

  async function handlePayment() {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: params.customerId,
          amountType: paymentType,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      }
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>

      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="paymentType"
            value="deposit"
            checked={paymentType === "deposit"}
            onChange={() => setPaymentType("deposit")}
          />
          <span className="ml-2">Deposit ($200)</span>
        </label>

        <label className="flex items-center">
          <input
            type="radio"
            name="paymentType"
            value="full"
            checked={paymentType === "full"}
            onChange={() => setPaymentType("full")}
          />
          <span className="ml-2">Full Payment (${basePrice})</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
          />
          <span className="ml-2">Add Trip Insurance</span>
        </label>
      </div>

      <div className="mt-6 text-lg font-semibold">
        Total: ${totalPrice()}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}