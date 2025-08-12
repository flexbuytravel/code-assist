
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function StripeConnectedPage() {
    const router = useRouter();

    const goToSettings = () => {
        router.push('/company/settings?stripe_return=success');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
            <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-primary/20">
                <CardHeader className="text-center">
                    <div className="pb-4 flex justify-center">
                        <CheckCircle className="h-24 w-24 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Connection Successful!</CardTitle>
                    <CardDescription>Your Stripe account has been successfully connected to FlexBuy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">You are now ready to receive payments from your customers directly to your Stripe account. You can manage your connection and view payout details from your settings dashboard.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={goToSettings}>
                        <ArrowLeft className="mr-2" />
                        Back to Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
