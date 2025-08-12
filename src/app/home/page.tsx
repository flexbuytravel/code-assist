'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPackageById } from '@/app/api/packages/getPackageById';
import { Loader } from '@/components/Loader';

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [packageId, setPackageId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [packageData, setPackageData] = useState<any>(null);

  // Pre-fill from URL if provided
  useEffect(() => {
    const urlPackageId = searchParams.get('packageId') || '';
    const urlReferralCode = searchParams.get('referralCode') || '';
    if (urlPackageId && urlReferralCode) {
      setPackageId(urlPackageId);
      setReferralCode(urlReferralCode);
    }
  }, [searchParams]);

  const handleLoadPackage = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getPackageById(packageId, referralCode);
      if (!data) {
        setError('Invalid package or referral code.');
        setLoading(false);
        return;
      }
      setPackageData(data);
      router.push(`/auth/register?packageId=${packageId}&referralCode=${referralCode}`);
    } catch (err: any) {
      console.error(err);
      setError('Error loading package.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">Claim Your Package</h1>

      <input
        type="text"
        placeholder="Package ID"
        value={packageId}
        onChange={(e) => setPackageId(e.target.value)}
        className="border p-2 mb-2 w-64"
        disabled={!!searchParams.get('packageId')}
      />
      <input
        type="text"
        placeholder="Referral Code"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        className="border p-2 mb-2 w-64"
        disabled={!!searchParams.get('referralCode')}
      />

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={handleLoadPackage}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Loading...' : 'Load Package'}
      </button>
    </div>
  );
}