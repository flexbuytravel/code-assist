'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerCustomer } from '@/app/api/auth/registerCustomer';
import { getPackageById } from '@/app/api/packages/getPackageById';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    packageId: '',
    referralCode: ''
  });

  const [packageData, setPackageData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pkgId = searchParams.get('packageId') || '';
    const refCode = searchParams.get('referralCode') || '';

    if (pkgId && refCode) {
      setForm((prev) => ({
        ...prev,
        packageId: pkgId,
        referralCode: refCode
      }));
      // Fetch and validate package
      getPackageById(pkgId, refCode)
        .then((data) => {
          if (!data) {
            setError('Invalid package or referral code.');
            return;
          }
          setPackageData(data);
        })
        .catch(() => setError('Error validating package.'));
    }
  }, [searchParams]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const success = await registerCustomer(form);
      if (success) {
        router.push('/customer/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {packageData && (
        <div className="mb-4 border p-2 rounded bg-gray-50">
          <p><strong>Package:</strong> {packageData.name}</p>
          <p><strong>Price:</strong> ${packageData.price}</p>
          <p><strong>Agent:</strong> {packageData.agentName}</p>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-2">
        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required className="border p-2 w-full" />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className="border p-2 w-full" />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className="border p-2 w-full" />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required className="border p-2 w-full" />
        <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required className="border p-2 w-full" />
        <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} required className="border p-2 w-full" />

        <input type="text" name="packageId" value={form.packageId} readOnly className="border p-2 w-full bg-gray-100" />
        <input type="text" name="referralCode" value={form.referralCode} readOnly className="border p-2 w-full bg-gray-100" />

        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded w-full">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}