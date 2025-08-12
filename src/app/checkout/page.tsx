
import { Suspense } from 'react';
import { getPackageDetails } from '@/lib/data';
import CheckoutClientPage from './client-page';
import { Skeleton } from '@/components/ui/skeleton';


function CheckoutPageSkeleton() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="container mx-auto max-w-2xl">
                <header className="py-4 mb-6 text-center">
                    <Skeleton className="h-16 w-16 mx-auto mb-4" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                </header>
                <div className="space-y-6">
                   <Skeleton className="h-48 w-full" />
                   <Skeleton className="h-32 w-full" />
                   <Skeleton className="h-64 w-full" />
                   <Skeleton className="h-12 w-full mt-4" />
                </div>
            </div>
        </div>
    )
}

export default async function CheckoutPageWrapper({ searchParams }: { searchParams: { packageId?: string; referral?: string } }) {
  const { packageId } = searchParams;

  if (!packageId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-destructive">Invalid checkout link. Please ensure the Package ID is correct.</p>
      </div>
    );
  }

  const packageDetails = await getPackageDetails(packageId);

  if (!packageDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-destructive">Could not find package or payment details for ID: {packageId}. It may be invalid or already claimed.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<CheckoutPageSkeleton />}>
      <CheckoutClientPage packageDetails={packageDetails} />
    </Suspense>
  );
}
