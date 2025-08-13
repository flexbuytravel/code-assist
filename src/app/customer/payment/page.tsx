// src/app/customer/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageId = searchParams.get("packageId") || "";
  const customerId = searchParams.get("customerId") || "";
  const basePrice = 998; // promotional price

  const [insuranceType, setInsuranceType] = useState<"none" | "deposit" | "doubleUp">("none");
  const [totalPrice, setTotalPrice] = useState(basePrice);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let price = basePrice;
    if (insuranceType === "deposit") price += 200;
    if (insuranceType === "doubleUp") price += 600;
    setTotalPrice(price);
  }, [insuranceType]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          customerId,
          insuranceType,
        }),
      });

      if (!res.ok) throw new Error("Failed to create checkout session");

      const { url } = await res.json();
      router.push(url);
    } catch (err) {
      console.error(err);
      alert("Error starting payment process.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>

      <div className="mb-4">
        <p className="mb-2">Base Package Price: <strong>${basePrice}</strong></p>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="insurance"
              value="none"
              checked={insuranceType === "none"}
              onChange={() => setInsuranceType("none")}
            />
            <span className="ml-2">No Add-On</span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="insurance"
              value="deposit"
              checked={insuranceType === "deposit"}
              onChange={() => setInsuranceType("deposit")}
            />
            <span className="ml-2">Deposit (+$200) — Adds 1 Trip, 6 Months Expiry</span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="insurance"
              value="doubleUp"
              checked={insuranceType === "doubleUp"}
              onChange={() => setInsuranceType("doubleUp")}
            />
            <span className="ml-2">Double Up (+$600) — Doubles Trips, 54 Months Expiry</span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-lg font-semibold">Total: ${totalPrice}</p>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}