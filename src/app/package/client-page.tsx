
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import type { PackageDetails, Trip } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/countdown-timer';
import { AlertCircle, CheckCircle, Ship, Home, Sun, Wallet, Package2, LayoutDashboard, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const TripCard = ({ trip }: { trip: Trip }) => {
    const tripIcons: { [key: number]: React.ReactNode } = {
        1: <Home className="h-8 w-8 text-primary" />,
        2: <Ship className="h-8 w-8 text-primary" />,
        3: <Home className="h-8 w-8 text-primary" />,
        4: <Home className="h-8 w-8 text-primary" />,
        5: <Sun className="h-8 w-8 text-primary" />,
    };
    return (
        <Card className="flex flex-col md:flex-row items-center gap-4 p-4 transition-transform hover:scale-[1.02] hover:shadow-lg bg-card/70">
            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                {tripIcons[trip.id] || <CheckCircle className="h-8 w-8 text-primary" />}
            </div>
            <div className="text-center md:text-left">
                <h3 className="font-headline font-semibold text-lg">{trip.title}</h3>
                <p className="text-muted-foreground text-sm">{trip.description}</p>
            </div>
        </Card>
    );
};

export default function PackageClientPage({ packageDetails }: { packageDetails: PackageDetails }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referral = searchParams.get('referral');
  const packageId = searchParams.get('packageId');
  
  const [isClient, setIsClient] = useState(false);
  const [offerExpired, setOfferExpired] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Also check on mount
    const storageKey = `flexbuy_expiry_${packageId}`;
    const savedExpiry = localStorage.getItem(storageKey);
    if (savedExpiry && new Date().getTime() > parseInt(savedExpiry, 10)) {
        setOfferExpired(true);
    }
  }, [packageId]);

  const handleOfferExpire = () => {
      setOfferExpired(true);
  };

  const displayPrice = packageDetails.promotionalPrice;

  if (!packageId || !referral) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 text-center">
          <p className="text-destructive">Invalid package information. Please check your URL.</p>
        </div>
      );
  }

  const handleCreateAccount = () => {
    const createAccountUrl = new URL(`${window.location.origin}/customer/create-account`);
    createAccountUrl.searchParams.set('packageId', packageId);
    createAccountUrl.searchParams.set('referral', referral);
    router.push(createAccountUrl.toString());
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background font-body">
       <header className="bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Image src="/logo2.png" alt="FlexBuy Logo" width={40} height={40} data-ai-hint="logo wave"/>
                <h1 className="text-2xl font-headline font-bold text-primary">FlexBuy</h1>
            </div>
            <Badge variant="secondary" className="text-sm">Referral: {referral}</Badge>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-4xl font-headline font-bold text-foreground leading-tight">Your Exclusive <span className="text-primary">Vacation Package</span></h2>
            <div className="space-y-4">
              {packageDetails.trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-24 shadow-xl border-2 border-accent bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">
                    {offerExpired ? 'Standard Package' : 'Limited Time Offer'}
                </CardTitle>
                 <CardDescription>
                    {offerExpired ? 'The promotional period has ended.' : 'This price is only available for a short time.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isClient && !offerExpired && <CountdownTimer packageId={packageId} onExpire={handleOfferExpire} />}

                <div className="flex justify-around items-baseline text-center">
                    {offerExpired ? (
                        <div>
                            <p className="text-sm text-primary">Regular Price</p>
                            <p className="text-5xl font-bold text-primary">${packageDetails.regularPrice.toLocaleString()}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Regular Price</p>
                                <p className="text-2xl font-semibold text-muted-foreground line-through">${packageDetails.regularPrice.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-primary">Your Price</p>
                                <p className="text-5xl font-bold text-primary">${displayPrice.toLocaleString()}</p>
                            </div>
                        </>
                    )}
                </div>

                <Separator />
                
                <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted rounded-md">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{packageDetails.nonRefundableNote}</span>
                </div>
                 <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted rounded-md">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Package expires 36 months from date of purchase. All travel must be completed by expiration.</span>
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button className="w-full text-lg h-12 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreateAccount}>
                    Create Account to Checkout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
