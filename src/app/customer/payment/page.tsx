'use client';

import { useState, useEffect } from 'react';

export default function PaymentPage() {
  const [paymentType, setPaymentType] = useState<'deposit' | 'double_up' | 'full'>('deposit');
  const [total, setTotal] = useState(200);
  const [loading, setLoading] = useState(false);

  // Example: in a real app, these should come from your Firestore or route params
  const customerId = 'exampleCustomerId';
  const packageId = 'examplePackageId';
  const packagePrice = 1000; // Example $1,000 full payment

  useEffect(() => {
    if (paymentType === 'deposit') setTotal(200);
    else if (paymentType === 'double_up') setTotal(600);
    else if (paymentType === 'full') setTotal(packagePrice);
  }, [paymentType]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, packageId, paymentType }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert('Error creating payment session.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>

      <div className="mb-4">
        <label className="block font-medium mb-2">Choose Payment Option:</label>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentType"
              value="deposit"
              checked={paymentType === 'deposit'}
              onChange={() => setPaymentType('deposit')}
              className="mr-2"
            />
            Deposit ($200) — adds 1 trip & extends time 6 months
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="paymentType"
              value="double_up"
              checked={paymentType === 'double_up'}
              onChange={() => setPaymentType('double_up')}
              className="mr-2"
            />
            Double Up ($600) — doubles trips & extends time 54 months
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="paymentType"
              value="full"
              checked={paymentType === 'full'}
              onChange={() => setPaymentType('full')}
              className="mr-2"
            />
            Full Payment (${packagePrice})
          </label>
        </div>
      </div>

      <div className="text-xl font-semibold mb-4">
        Total: ${total.toFixed(2)}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
      >
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}