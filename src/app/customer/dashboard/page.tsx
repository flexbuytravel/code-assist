'use client';

import { useState } from 'react';

export default function CustomerDashboard({ customerId, packageId, basePrice }: { customerId: string; packageId: string; basePrice: number }) {
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');
  const [includeInsurance, setIncludeInsurance] = useState(false);

  const calculatePrice = () => {
    let price = paymentType === 'deposit' ? 200 : basePrice; // deposit = $200, full = basePrice
    if (includeInsurance) {
      price += paymentType === 'deposit' ? 400 : 600; // insurance adds cost
    }
    return price;
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          packageId,
          price: calculatePrice(),
          paymentType,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert('Payment session could not be created.');
      }
    } catch (err) {
      console.error(err);
      alert('Error starting payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Your Package</h1>

      <div className="mt-4">
        <label className="mr-4">
          <input
            type="radio"
            checked={paymentType === 'deposit'}
            onChange={() => setPaymentType('deposit')}
          />{' '}
          Pay Deposit ($200)
        </label>

        <label>
          <input
            type="radio"
            checked={paymentType === 'full'}
            onChange={() => setPaymentType('full')}
          />{' '}
          Pay in Full (${basePrice})
        </label>
      </div>

      <div className="mt-4">
        <label>
          <input
            type="checkbox"
            checked={includeInsurance}
            onChange={() => setIncludeInsurance(!includeInsurance)}
          />{' '}
          Add Trip Insurance {paymentType === 'deposit' ? '(+$400)' : '(+$600)'}
        </label>
      </div>

      <p className="mt-4 text-lg font-semibold">
        Total: ${calculatePrice()}
      </p>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}