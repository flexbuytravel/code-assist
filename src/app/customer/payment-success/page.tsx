"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setMessage("No session ID found.");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/stripe/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage(`Payment successful! You paid $${data.amountPaid}.`);
        } else {
          setMessage(`Payment verification failed: ${data.error}`);
        }
      } catch (err) {
        setMessage("Error verifying payment.");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Payment Success</h1>
      <p>{message}</p>
    </div>
  );
}