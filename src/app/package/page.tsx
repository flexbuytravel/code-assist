
import { Suspense } from 'react';
import { getPackageDetails } from '@/lib/data';
import PackageClientPage from './client-page';
import { Skeleton } from '@/components/ui/skeleton';


function PackagePageSkeleton() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <header className="py-4 mb-6">
                    <Skeleton className="h-10 w-48" />
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-10 w-3/4" />
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-[500px] w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default async function PackagePageWrapper({ searchParams }: { searchParams: { packageId?: string; referral?: string } }) {
  const { packageId } = searchParams;

  if (!packageId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-destructive">Invalid package link. Please use the link provided and ensure the Package ID is correct.</p>
      </div>
    );
  }

  const packageDetails = await getPackageDetails(packageId);

  if (!packageDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-destructive">Could not find package details for ID: {packageId}. This ID may be invalid or already claimed.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<PackagePageSkeleton />}>
      <PackageClientPage packageDetails={packageDetails} />
    </Suspense>
  );
}
