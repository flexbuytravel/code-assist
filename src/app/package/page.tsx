"use client";

import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/lib/functions";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PackageDetails({ params }: { params: { id: string } }) {
  const { id } = params;
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const result: any = await createCheckoutSession(id);
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to initialize");
      await stripe.redirectToCheckout({ sessionId: result.sessionId });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Package Details</h1>
      <p>Package ID: {id}</p>
      <button onClick={handleBuy} disabled={loading}>
        {loading ? "Redirecting..." : "Buy Now"}
      </button>
    </div>
  );
}