
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomerDashboardData, CustomerDashboardData, CustomerPackage, Trip } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CheckCircle, Clock, Package, Star, AlertTriangle, Info, Home, Ship, Sun, Infinity, XCircle } from 'lucide-react';
import { CountdownTimer } from '@/components/countdown-timer';
import { useAuth } from '@/hooks/use-auth';


const tripIcons: { [key: number]: React.ReactNode } = {
    1: <Home className="h-6 w-6 text-primary" />,
    2: <Ship className="h-6 w-6 text-primary" />,
    3: <Home className="h-6 w-6 text-primary" />,
    4: <Home className="h-6 w-6 text-primary" />,
    5: <Sun className="h-6 w-6 text-primary" />,
};

const TripListItem = ({ trip }: { trip: Trip }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex-shrink-0">
            {tripIcons[trip.id] || <Package className="h-6 w-6 text-primary" />}
        </div>
        <div>
            <h4 className="font-semibold">{trip.title}</h4>
            <p className="text-sm text-muted-foreground">{trip.description}</p>
        </div>
    </div>
);

const PackageCard = ({ pkg }: { pkg: CustomerPackage }) => {
    const router = useRouter();

    const getStatusInfo = () => {
        switch(pkg.status) {
            case 'Pending': return { color: 'bg-yellow-500', icon: <Clock className="mr-1 h-3 w-3" />, text: 'Pending Payment' };
            case 'Active': return { color: 'bg-green-500', icon: <CheckCircle className="mr-1 h-3 w-3" />, text: 'Active' };
            case 'Redeemed': return { color: 'bg-blue-500', icon: <Star className="mr-1 h-3 w-3" />, text: 'Redeemed'};
            case 'Expired': return { color: 'bg-red-500', icon: <XCircle className="mr-1 h-3 w-3" />, text: 'Expired' };
            default: return { color: 'bg-gray-500', icon: <Info className="mr-1 h-3 w-3" />, text: 'Unknown' };
        }
    }
    const statusInfo = getStatusInfo();

    const handleAction = () => {
        if (pkg.status === 'Pending') {
            const checkoutUrl = new URL(`${window.location.origin}/checkout`);
            checkoutUrl.searchParams.set('packageId', pkg.id);
            checkoutUrl.searchParams.set('referral', pkg.referralCode);
            if (pkg.price) {
                checkoutUrl.searchParams.set('price', pkg.price.toString());
            }
            router.push(checkoutUrl.toString());
        } else {
             router.push(`/customer/booking?packageId=${pkg.id}`);
        }
    }
    
    const ExpirationInfo = () => {
        if (pkg.status !== 'Active') return null;

        if (pkg.insuranceType === 'Double Up') {
            return (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium mt-2">
                    <Infinity className="h-5 w-5" />
                    <span>Lifetime Access (Never Expires)</span>
                </div>
            )
        }
        
        if (pkg.expirationDate) {
             return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4" />
                    <span>Expires: {pkg.expirationDate.toLocaleDateString()}</span>
                </div>
            )
        }
        
        return null;
    }


    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-headline">{pkg.title}</CardTitle>
                        <ExpirationInfo />
                    </div>
                     <Badge className={`w-fit mt-2 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                {pkg.status === 'Pending' && (
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm p-3 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
                            <AlertTriangle className="h-5 w-5 mt-0.5"/>
                            <div>
                                <p className="font-semibold">Action Required</p>
                                <p>Your package is pending. Please complete your purchase to activate.</p>
                            </div>
                        </div>
                        <CountdownTimer packageId={pkg.id} />
                    </div>
                )}
                 <div className="flex items-start gap-2 text-sm p-3 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                    <Info className="h-5 w-5 mt-0.5"/>
                    <p className="font-semibold">Remember: Your first trip must be a 5-day condo stay with a required 90-minute property tour.</p>
                </div>
                 <div>
                    <h4 className="text-lg font-semibold mb-3">Trips Included:</h4>
                     <div className="space-y-2">
                        {pkg.trips.map(trip => (
                            <TripListItem key={trip.id} trip={trip} />
                        ))}
                    </div>
                </div>
                
                {pkg.status !== 'Redeemed' && pkg.status !== 'Expired' && (
                     <Button className="w-full mt-4" onClick={handleAction}>
                        {pkg.status === 'Pending' ? 'Complete Purchase' : 'Book a Trip'}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
};


const DashboardSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-96 w-full" />
    </div>
)

export default function CustomerDashboardPage() {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const { customerData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!customerData) {
      router.replace('/customer/login');
      return;
    }

    const fetchData = async () => {
      const result = await getCustomerDashboardData(customerData.uid);
      setData(result);
    };

    fetchData();
  }, [customerData, loading, router]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { customerName, packages } = data;
  const pendingPackages = packages.filter(p => p.status === 'Pending' || p.status === 'Deposit Paid');
  const activePackages = packages.filter(p => p.status === 'Active');
  const redeemedPackages = packages.filter(p => p.status === 'Redeemed' || p.status === 'Expired');

  return (
    <div className="space-y-8">
        <h2 className="text-3xl font-headline">Welcome, {customerName}</h2>
        
        {pendingPackages.length > 0 && (
            <div>
                <h3 className="text-2xl font-semibold mb-4">Pending Packages</h3>
                {pendingPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        )}
        
        {activePackages.length > 0 && (
            <div>
                <h3 className="text-2xl font-semibold mb-4">Your Active Packages</h3>
                 <div className="space-y-6">
                    {activePackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                 </div>
            </div>
        )}

        {redeemedPackages.length > 0 && (
            <div>
                <h3 className="text-2xl font-semibold mb-4">Package History</h3>
                 <div className="space-y-6">
                    {redeemedPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                 </div>
            </div>
        )}

        {packages.length === 0 && (
            <Card className="text-center p-8">
                <CardTitle>No Packages Found</CardTitle>
                <CardDescription className="mt-2">You don't have any active packages. Find a deal to get started!</CardDescription>
                <Button className="mt-4" onClick={() => router.push('/home')}>Browse Deals</Button>
            </Card>
        )}
    </div>
  );
}
