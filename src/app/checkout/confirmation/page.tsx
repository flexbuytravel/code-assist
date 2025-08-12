
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Mail, Phone, FileText, Home, ShieldCheck, User, Package, Building, CreditCard } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';

interface CheckoutData {
    customerName: string;
    packagePurchased: string;
    insuranceSelection: string;
    packageId: string;
    referralCode: string;
    amount: number;
    isDeposit: boolean;
    fullAmount: number;
}

function ConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<CheckoutData | null>(null);
    const [companyConfirmationNumber, setCompanyConfirmationNumber] = useState('');
    const [loading, setLoading] = useState(true);

    const stripeConfirmationId = searchParams.get('session_id');

    useEffect(() => {
        const processConfirmation = async () => {
            if (!stripeConfirmationId) {
                setLoading(false);
                return;
            };

            const storedDataString = sessionStorage.getItem('checkoutData');
            if (!storedDataString) {
                setLoading(false);
                return;
            };

            const storedData: CheckoutData = JSON.parse(storedDataString);
            setData(storedData);

            try {
                // Find the package in Firestore
                const packagesRef = collection(db, 'packages');
                const q = query(packagesRef, where("packageId", "==", storedData.packageId));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error("Package not found in database.");
                }

                const packageDoc = querySnapshot.docs[0];
                const packageData = packageDoc.data();
                
                let updatePayload: any = {
                    insurance: storedData.insuranceSelection,
                    stripeSessionId: stripeConfirmationId,
                };
                
                if (storedData.isDeposit) {
                     updatePayload = {
                        ...updatePayload,
                        status: 'Deposit Paid',
                        depositPaid: storedData.amount,
                        price: storedData.fullAmount, // Store the full price
                        depositDate: new Date(),
                     };
                     const paymentDueDate = new Date();
                     paymentDueDate.setMonth(paymentDueDate.getMonth() + 6);
                     updatePayload.paymentDueDate = paymentDueDate;
                } else {
                    updatePayload = {
                        ...updatePayload,
                        status: 'Paid',
                        pricePaid: storedData.amount,
                        purchaseDate: new Date(),
                    };
                }


                // Update the package status if it's not already paid
                if(packageData.status !== 'Paid'){
                    await updateDoc(packageDoc.ref, updatePayload);
                }
                
                // Fetch agent and then company to get confirmation ID
                const agentDocRef = doc(db, 'agents', packageData.agentId);
                const agentDocSnap = await getDoc(agentDocRef);
                if (agentDocSnap.exists()) {
                    const companyDocRef = doc(db, 'companies', agentDocSnap.data().companyId);
                    const companyDocSnap = await getDoc(companyDocRef);
                    if (companyDocSnap.exists()) {
                        const officeId = companyDocSnap.data().confirmationId || '000';
                        
                        // Get sales for this company for today
                        const today = new Date();
                        const start = startOfDay(today);
                        const end = endOfDay(today);
                        
                        const todaysSalesQuery = query(
                            packagesRef, 
                            where('agentId', 'in', (await getDocs(query(collection(db, 'agents'), where('companyId', '==', companyDocSnap.id)))).docs.map(d => d.id)),
                            where('status', 'in', ['Paid', 'Deposit Paid']),
                            where(storedData.isDeposit ? 'depositDate' : 'purchaseDate', '>=', start),
                            where(storedData.isDeposit ? 'depositDate' : 'purchaseDate', '<=', end)
                        );

                        const todaysSalesSnapshot = await getDocs(todaysSalesQuery);
                        const dealNumber = (todaysSalesSnapshot.size).toString().padStart(2, '0');

                        const now = new Date();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        const year = String(now.getFullYear()).slice(-2);
                        const datePart = `${month}${day}${year}`;
                        
                        setCompanyConfirmationNumber(`${officeId}${datePart}${dealNumber}`);
                    }
                }

                // Clear the data after use so it's not accidentally shown again
                // sessionStorage.removeItem('checkoutData');
            } catch (error) {
                console.error("Error updating package status:", error);
            } finally {
                setLoading(false);
            }
        };
        
        processConfirmation();

    }, [stripeConfirmationId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Processing your confirmation...</p>
            </div>
        )
    }

    if (!stripeConfirmationId || !data) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-lg shadow-xl text-center p-8">
                    <CardTitle className="text-2xl font-headline mb-4">Looking for your confirmation?</CardTitle>
                    <CardDescription className="mb-6">
                        If you have completed a purchase, please log in to your dashboard to see your package details.
                    </CardDescription>
                    <Button className="w-full" onClick={() => router.push('/customer/login')}>
                        Go to Customer Login
                    </Button>
                </Card>
             </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
            <Card className="w-full max-w-lg shadow-xl text-center border-primary/20">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-20 w-20 text-green-500" />
                    </div>
                    <CardTitle className="text-3xl font-headline">
                        Thank You, {data.customerName}!
                    </CardTitle>
                    <CardDescription>
                        {data.isDeposit ? "Your deposit was successful and your price is locked in." : "Your payment was successful and your package is confirmed."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {data.isDeposit ? (
                        <div className="p-4 rounded-md bg-blue-100 text-blue-800">
                             <p className="font-semibold">What's Next?</p>
                             <p className="text-sm">You have secured your promotional price for 6 months. You can log in to your dashboard at any time to pay the remaining balance. Once paid in full, you can book your trips.</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            You can now book your trip by calling Monster Reservations Group. Please provide them with your <strong className="text-primary">Confirmation Number</strong> below.
                        </p>
                    )}
                    <Card className="text-left p-4 bg-muted/50">
                        <h3 className="font-semibold mb-4 text-lg">Purchase & Booking Info</h3>
                        <div className="space-y-4">
                            {!data.isDeposit && (
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <h4 className="font-medium">Your Confirmation Number (for booking)</h4>
                                        <p className="text-sm text-muted-foreground font-mono">{companyConfirmationNumber || 'Generating...'}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-primary" />
                                <div>
                                    <h4 className="font-medium">Stripe Transaction ID</h4>
                                    <p className="text-sm text-muted-foreground font-mono break-all">{stripeConfirmationId}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary" />
                                <div>
                                    <h4 className="font-medium">Booking & Sales Number</h4>
                                    <p className="text-sm text-muted-foreground font-mono">888-888-8888</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary" />
                                <div>
                                    <h4 className="font-medium">Customer Service Number</h4>
                                    <p className="text-sm text-muted-foreground font-mono">888-123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-primary" />
                                <div>
                                    <h4 className="font-medium">Package</h4>
                                    <p className="text-sm text-muted-foreground">{data.packagePurchased} ({data.packageId})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <div>
                                    <h4 className="font-medium">Insurance</h4>
                                    <p className="text-sm text-muted-foreground capitalize">{data.insuranceSelection.replace('-', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                     <Button className="w-full text-lg h-12" onClick={() => router.push('/customer/dashboard')}>
                        <Home className="mr-2" />
                        Go to My Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function ConfirmationPageWrapper() {
    return (
        <Suspense fallback={<div>Loading confirmation...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
