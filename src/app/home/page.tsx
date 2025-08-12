
'use client';

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from 'next/link';

export default function HomePage() {

  const handleTrackPackage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const trackingNumber = formData.get('package-id') as string;
    const referralCode = formData.get('referral-id') as string;
    if (trackingNumber && referralCode) {
      window.location.href = `/package?packageId=${trackingNumber}&referral=${referralCode}`;
    } else if (trackingNumber) {
      window.location.href = `/package?packageId=${trackingNumber}`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Image
        src="/logo2.png"
        alt="FlexBuy Logo"
        width={200}
        height={200}
        data-ai-hint="logo wave"
        className="mb-8"
        priority
      />

      <Card className="w-full max-w-sm">
        <form onSubmit={handleTrackPackage}>
          <CardHeader>
            <CardTitle className="text-center">Load Your Package</CardTitle>
            <CardDescription className="text-center">Enter your package and referral ID to view details.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="package-id">Package ID</Label>
              <Input
                type="text"
                id="package-id"
                name="package-id"
                placeholder="Enter package ID"
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="referral-id">Referral ID</Label>
              <Input
                type="text"
                id="referral-id"
                name="referral-id"
                placeholder="Enter referral ID"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button type="submit">Load Package</Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild variant="outline">
              <Link href="/customer/login">Customer Portal</Link>
          </Button>
          <Button asChild variant="outline">
              <Link href="/agent/login">Agent Portal</Link>
          </Button>
          <Button asChild variant="outline">
              <Link href="/company/login">Company Portal</Link>
          </Button>
          <Button asChild variant="outline">
              <Link href="/admin/login">Admin Portal</Link>
          </Button>
      </div>
    </div>
  );
}
