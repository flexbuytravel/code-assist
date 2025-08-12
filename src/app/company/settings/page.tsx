
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const [companyEmail, setCompanyEmail] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [isStripeConnected, setIsStripeConnected] = useState(false);

  const companyUid = sessionStorage.getItem('companyUid');

  useEffect(() => {
    const fetchCompanyInfo = async () => {
        if (!companyUid) {
            setLoading(false);
            return;
        }
        try {
            const companyRef = doc(db, 'companies', companyUid);
            const docSnap = await getDoc(companyRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCompanyName(data.name || '');
                setOwnerName(data.ownerName || '');
                setAddress(data.address || '');
                setPhone(data.phone || '');
                setConfirmationId(data.confirmationId || '');
                setCompanyEmail(data.email || '');
                setIsStripeConnected(!!data.stripeAccountId);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch company information.' });
        } finally {
            setLoading(false);
        }
    }
    fetchCompanyInfo();

    if (searchParams.get('stripe_return') === 'success') {
      toast({
        title: "Stripe Connected!",
        description: "Your account is now ready to receive payments.",
        variant: "default",
        className: "bg-green-100 border-green-400 text-green-800"
      });
    }

  }, [companyUid, toast, searchParams]);

  const handleInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyUid) return;
    setSaving(true);

    const updatedData = {
        name: companyName,
        ownerName,
        address,
        phone,
        confirmationId,
    };
    
    try {
        const companyRef = doc(db, 'companies', companyUid);
        await updateDoc(companyRef, updatedData);
        toast({
          title: "Company Info Updated",
          description: "Your company details have been saved.",
        });
    } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to update company information.' });
    } finally {
        setSaving(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  };

  const handleStripeConnect = async () => {
    setConnectingStripe(true);
    try {
        // Use the live URL for the function
        const response = await fetch('https://us-central1-flexwave-deals.cloudfunctions.net/connect_redirect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              companyId: companyUid, 
              origin: window.location.origin 
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to connect to Stripe.');
        }

        const { url } = await response.json();
        if (url) {
            window.location.href = url;
        } else {
            throw new Error('Could not get Stripe onboarding URL.');
        }

    } catch (error: any) {
        console.error('Stripe connection error:', error);
        toast({
            variant: 'destructive',
            title: 'Stripe Connection Failed',
            description: error.message || 'Could not connect to Stripe. Please try again later.',
        });
        setConnectingStripe(false);
    }
  };

  if (loading) {
      return (
          <div className="grid gap-6">
              <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
      )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Manage your company's public details and contact information.</CardDescription>
        </CardHeader>
        <form onSubmit={handleInfoUpdate}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Your Company LLC" disabled={saving} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="owner-name">Owner Name</Label>
                    <Input id="owner-name" value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="John Doe" disabled={saving}/>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company-id">Company Login ID</Label>
                    <Input id="company-id" value={companyEmail} disabled />
                    <p className="text-sm text-muted-foreground">This ID is permanent and used for logging in.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirmation-id">Company Confirmation ID</Label>
                    <Input id="confirmation-id" value={confirmationId} onChange={e => setConfirmationId(e.target.value.replace(/[^0-9]/g, ''))} required maxLength={3} placeholder="XXX" disabled={saving}/>
                    <p className="text-sm text-muted-foreground">A 3-digit ID for customer confirmations.</p>
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="123 Main St, Anytown, USA" disabled={saving}/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(555) 123-4567" disabled={saving}/>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Payment Gateway</CardTitle>
              <CardDescription>Connect your Stripe account to receive payments from customers.</CardDescription>
          </CardHeader>
          <CardContent>
             {isStripeConnected ? (
                  <div className="flex items-center gap-2 p-4 rounded-md border border-green-300 bg-green-50 text-green-700">
                      <CheckCircle className="h-6 w-6"/>
                      <div className="font-semibold">Your Stripe account is connected. You are ready to receive payments.</div>
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground">
                      By connecting your Stripe account, you agree to Stripe's terms of service. You will be redirected to Stripe to securely log in and authorize the connection.
                  </p>
              )}
          </CardContent>
          {!isStripeConnected && (
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleStripeConnect} disabled={connectingStripe}>
                    {connectingStripe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {connectingStripe ? 'Connecting...' : 'Connect with Stripe'}
                </Button>
            </CardFooter>
          )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Change your company portal password.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Update Password</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
