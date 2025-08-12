
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Phone, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

function BookingInfoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const packageId = searchParams.get('packageId') || 'N/A';
    
    // In a real app, this would be fetched based on the packageId
    const confirmationNumber = `FLEX-${packageId.slice(-4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const handlePdfView = () => {
        // In a real app, this would open a link to the PDF file.
        // For this demo, we can just show an alert or a toast.
        alert('This would open the destinations PDF.');
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-center text-2xl font-headline">Ready to Book Your Trip?</CardTitle>
                    <CardDescription className="text-center">
                        Contact Monster Reservations Group directly to book your vacation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-4 bg-muted/80 rounded-lg">
                        <p className="text-sm text-muted-foreground">Your Confirmation Number</p>
                        <p className="text-2xl font-bold font-mono tracking-widest text-primary">{confirmationNumber}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                        <Card className="p-4">
                            <h4 className="font-semibold flex items-center justify-center gap-2"><Phone className="h-5 w-5"/>Sales & Booking</h4>
                            <a href="tel:888-888-8888" className="text-lg font-bold text-primary hover:underline">888-888-8888</a>
                        </Card>
                         <Card className="p-4">
                            <h4 className="font-semibold flex items-center justify-center gap-2"><Phone className="h-5 w-5"/>Customer Service</h4>
                             <a href="tel:888-123-4567" className="text-lg font-bold text-primary hover:underline">888-123-4567</a>
                        </Card>
                    </div>

                    <Button variant="outline" className="w-full" onClick={handlePdfView}>
                        <FileText className="mr-2"/>
                        View Destinations (PDF)
                    </Button>
                </CardContent>
                 <CardFooter className="flex-col gap-4">
                    <p className="text-xs text-muted-foreground text-center">Please have your confirmation number ready when you call.</p>
                     <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2"/>
                        Back to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingInfoContent />
        </Suspense>
    )
}
