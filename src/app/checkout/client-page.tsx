
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { PackageDetails, Trip } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Home, Wallet, BadgeCheck, AlertCircle, ShieldCheck, LifeBuoy, FileText, CheckCircle, Infinity, Loader2, CalendarClock, Package2, Ship, Sun } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

interface CheckoutClientPageProps {
  packageDetails: PackageDetails;
}

interface DisplayTrip extends Trip {
  count: number;
}

const TripCard = ({ trip }: { trip: DisplayTrip }) => {
    const tripIcons: { [key: number]: React.ReactNode } = {
        1: <Home className="h-6 w-6 text-primary" />,
        2: <Ship className="h-6 w-6 text-primary" />,
        3: <Home className="h-6 w-6 text-primary" />,
        4: <Home className="h-6 w-6 text-primary" />,
        5: <Sun className="h-6 w-6 text-primary" />,
    };
    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
             <div className="flex-shrink-0">
                {tripIcons[trip.id] || <Package2 className="h-6 w-6 text-primary" />}
            </div>
            <div>
                <h4 className="font-semibold">
                    {trip.count > 1 && `(${trip.count}) `}{trip.title}
                </h4>
                <p className="text-sm text-muted-foreground">{trip.description}</p>
            </div>
        </div>
    );
};


export default function CheckoutClientPage({ packageDetails }: CheckoutClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [insuranceOption, setInsuranceOption] = useState('none');
  const [payDeposit, setPayDeposit] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayTerms, setDisplayTerms] = useState<string[]>(packageDetails.terms);
  const [displayTrips, setDisplayTrips] = useState<DisplayTrip[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [offerExpired, setOfferExpired] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const packageId = searchParams.get('packageId');

  useEffect(() => {
    setIsClient(true);
    const name = sessionStorage.getItem('customerName') || 'Valued Customer';
    setCustomerName(name);
    setCustomerEmail(sessionStorage.getItem('customerEmail'));

    if (packageId) {
        const storageKey = `flexbuy_expiry_${packageId}`;
        const savedExpiry = localStorage.getItem(storageKey);
        if (savedExpiry && new Date().getTime() > parseInt(savedExpiry, 10)) {
            setOfferExpired(true);
        }
    }

    // Update terms based on insurance
    const newTerms = [...packageDetails.terms];
    const expirationTermIndex = newTerms.findIndex(term => term.includes('expires'));

    if (expirationTermIndex !== -1) {
        if (insuranceOption === 'standard') {
            newTerms[expirationTermIndex] = "Your package expires **54 months** from the date of purchase, unless insurance with extended terms is purchased. You must complete all travel by this date.";
        } else if (insuranceOption === 'double-up') {
            newTerms[expirationTermIndex] = "Your package **will never expire** because you have selected the Double Up & Lifetime protection plan.";
        } else {
            newTerms[expirationTermIndex] = "Your package expires **36 months** from the date of purchase, unless insurance with extended terms is purchased. You must complete all travel by this date.";
        }
    }
    setDisplayTerms(newTerms);

    // Update displayed trips based on insurance
    const baseTrips = packageDetails.trips;
    if (insuranceOption === 'standard') {
        const standardBonusTrip: Trip = { id: 6, title: '5 Day / 4 Night All-Inclusive', description: '12 Tropical Destinations – Covers 2 Adults + 2 Kids' };
        setDisplayTrips([...baseTrips, standardBonusTrip].map(t => ({...t, count: 1})));
    } else if (insuranceOption === 'double-up') {
        const tripMap = new Map<string, DisplayTrip>();
        const doubledTrips = [...baseTrips, ...baseTrips]; // Double all base trips

        doubledTrips.forEach(trip => {
            if (tripMap.has(trip.title)) {
                tripMap.get(trip.title)!.count++;
            } else {
                tripMap.set(trip.title, { ...trip, count: 1 });
            }
        });
        setDisplayTrips(Array.from(tripMap.values()));

    } else { // 'none'
        setDisplayTrips(baseTrips.map(t => ({ ...t, count: 1 })));
    }


  }, [insuranceOption, packageDetails.terms, packageDetails.trips, packageId]);

  const referral = searchParams.get('referral');

  if (!packageId || !referral) {
      return <div className="p-4">Missing package or referral information.</div>
  }
  
  const basePrice = offerExpired ? packageDetails.regularPrice : packageDetails.promotionalPrice;
  const insuranceCost = insuranceOption === 'standard' ? 200 : insuranceOption === 'double-up' ? 600 : 0;
  const fullAmount = basePrice + insuranceCost;
  const totalAmount = (payDeposit && !offerExpired) ? 200 : fullAmount;

  const handlePayment = async () => {
    if (!agreedToTerms) {
        toast({
            variant: "destructive",
            title: "Agreement Required",
            description: "You must agree to the Terms of Service to proceed.",
        });
        return;
    }
    
    setIsProcessing(true);
    toast({
        title: "Processing Purchase...",
        description: "Redirecting to our secure payment processor...",
    });

    const checkoutData = {
        customerName: customerName,
        packagePurchased: packageDetails.name,
        insuranceSelection: insuranceOption,
        packageId: packageId,
        referralCode: referral,
        amount: totalAmount,
        isDeposit: payDeposit && !offerExpired,
        fullAmount: fullAmount,
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    try {
        const response = await fetch('https://us-central1-flexwave-deals.cloudfunctions.net/connect_redirect/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: totalAmount,
                customerEmail: customerEmail,
                referralCode: referral,
                packageId: packageId,
                success_url: `${window.location.origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: window.location.href,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create Stripe Checkout session.');
        }

        const { url } = await response.json();
        if (url) {
            window.location.href = url;
        } else {
            throw new Error('Could not get checkout URL.');
        }

    } catch (error: any) {
        console.error('Stripe payment error:', error);
        toast({
            variant: 'destructive',
            title: 'Payment Error',
            description: error.message || 'An unexpected error occurred. Please try again.',
        });
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 font-body">
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        
        <header className="text-center mb-8">
            <Image src="/logo2.png" alt="FlexBuy Logo" width={80} height={80} className="mx-auto mb-4" data-ai-hint="logo wave"/>
            <h1 className="text-4xl font-headline font-bold text-primary">Secure Checkout</h1>
            <p className="text-muted-foreground mt-2">You're just a few steps away from your next adventure!</p>
        </header>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <BadgeCheck className="text-primary" />
                        <span>Your Package: {packageDetails.name}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 text-center">
                    {offerExpired ? (
                        <div>
                            <p className="text-sm text-muted-foreground">Regular Price</p>
                            <p className="text-2xl font-bold">${basePrice}</p>
                        </div>
                    ) : (
                         <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Promotional Price</p>
                                <p className="text-2xl font-bold">${basePrice}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Regular Price</p>
                                <p className="text-2xl font-bold text-muted-foreground line-through">${packageDetails.regularPrice}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package2 className="text-primary" />
                        <span>Package Contents</span>
                    </CardTitle>
                    <CardDescription>Review the trips included with your selection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                     {displayTrips.map((trip, index) => (
                        <TripCard key={`${trip.id}-${index}`} trip={trip} />
                    ))}
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-primary" />
                        <span>Add Trip Insurance (Optional)</span>
                    </CardTitle>
                    <CardDescription>Protect your vacation investment and get extra perks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={insuranceOption} onValueChange={setInsuranceOption} className="space-y-4">
                        <Label htmlFor="standard" className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 has-[:checked]:bg-secondary has-[:checked]:border-primary">
                            <RadioGroupItem value="standard" id="standard" className="mt-1"/>
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><LifeBuoy className="w-5 h-5"/>Standard Trip Protection (+$200)</h4>
                                <p className="text-sm text-muted-foreground">Adds an extra 5-Day/4-Night All-inclusive condo stay, provides white glove rebooking service, and **extends your package expiration by 18 months**.</p>
                            </div>
                        </Label>

                        <Label htmlFor="double-up" className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 has-[:checked]:bg-secondary has-[:checked]:border-primary">
                             <RadioGroupItem value="double-up" id="double-up" className="mt-1"/>
                             <div>
                                <h4 className="font-semibold flex items-center gap-2"><Infinity className="w-5 h-5"/>Double Up & Lifetime (+$600)</h4>
                                <p className="text-sm text-muted-foreground">Doubles your trips to a total of 10, fully insures every trip, includes premium white glove service, and **your package will never expire**.</p>
                             </div>
                        </Label>

                         <Label htmlFor="none" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 has-[:checked]:bg-secondary">
                             <RadioGroupItem value="none" id="none" />
                             <span className="font-semibold">No, thank you.</span>
                        </Label>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="text-primary" />
                        <span>Terms of Service</span>
                    </CardTitle>
                    <CardDescription>Please review and agree to the terms before purchasing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4 bg-muted/50 rounded-lg max-h-48 overflow-y-auto text-sm">
                    {displayTerms.map((term, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <p dangerouslySetInnerHTML={{ __html: term.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="pt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} />
                        <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        I have read and agree to the Terms of Service.
                        </label>
                    </div>
                </CardFooter>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {!offerExpired && (
                        <div className="flex items-center space-x-2 p-3 bg-secondary/50 rounded-lg">
                            <Checkbox id="deposit" checked={payDeposit} onCheckedChange={(checked) => setPayDeposit(checked as boolean)} />
                            <div>
                                <label
                                    htmlFor="deposit"
                                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Pay a $200 Deposit Today
                                </label>
                                <p className="text-xs text-muted-foreground">Secure this price and extend your payment deadline for 6 months.</p>
                            </div>
                        </div>
                     )}
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Package Price</span>
                        <span>${basePrice.toLocaleString()}</span>
                    </div>
                    {insuranceCost > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                            {insuranceOption === 'standard' ? 'Standard Protection' : 'Double Up & Lifetime'}
                            </span>
                            <span>+${insuranceCost.toLocaleString()}</span>
                        </div>
                    )}
                    {payDeposit && !offerExpired && (
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Deposit Paid Today</span>
                            <span className="text-green-600">-${(200).toLocaleString()}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-2xl">
                        <span>{payDeposit && !offerExpired ? 'Remaining Balance' : 'Total Due'}</span>
                        <span className="text-primary">${payDeposit && !offerExpired ? (fullAmount - 200).toLocaleString() : totalAmount.toLocaleString()}</span>
                    </div>
                     {payDeposit && !offerExpired && (
                        <div className="p-3 text-center bg-blue-100 rounded-lg text-blue-800">
                             <p className="font-bold">Total Due Today: ${totalAmount.toLocaleString()}</p>
                             <p className="text-xs">Your remaining balance of ${ (fullAmount - 200).toLocaleString()} will be due in 6 months.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Button className="w-full text-lg h-14 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePayment} disabled={!agreedToTerms || isProcessing}>
                {isProcessing ? <><Loader2 className="animate-spin" /> Redirecting...</> : `Pay $${totalAmount.toLocaleString()} Now`}
            </Button>
            <div className="text-center mt-2">
                 <Button variant="link" onClick={() => router.push('/home')}>Cancel and go back</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
