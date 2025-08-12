
'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';


function CreateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const packageId = searchParams.get('packageId') || '';
  const referralCode = searchParams.get('referral') || '';

  useEffect(() => {
    if (!packageId || !referralCode) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing package or referral information. Please use the link provided.',
      });
      // Optionally redirect to home if essential params are missing
      // router.push('/home'); 
    }
  }, [packageId, referralCode, toast]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: 'Passwords do not match.' });
      setLoading(false);
      return;
    }
    
    if (!packageId || !referralCode) {
       toast({ variant: 'destructive', title: 'Error', description: 'Missing package or referral information.' });
       setLoading(false);
       return;
    }

    try {
      // 1. Find the agent to link the sale
      const agentsRef = collection(db, 'agents');
      const agentQuery = query(agentsRef, where('referralCode', '==', referralCode));
      const agentSnapshot = await getDocs(agentQuery);

      if (agentSnapshot.empty) {
        throw new Error('Invalid referral code.');
      }
      const agentDoc = agentSnapshot.docs[0];
      const agentData = agentDoc.data();

      // 2. Find the pending, unclaimed package created by the agent
      const packagesRef = collection(db, 'packages');
      const packageQuery = query(
          packagesRef, 
          where('packageId', '==', packageId), 
          where('status', '==', 'Pending'),
          where('customerId', '==', null)
      );
      const packageSnapshot = await getDocs(packageQuery);

      if (packageSnapshot.empty) {
        throw new Error('This package ID is not valid or has already been claimed.');
      }
       const packageDoc = packageSnapshot.docs[0];


      // 3. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 4. Create the customer document in Firestore
      const customerData = {
        name: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        authUid: user.uid,
        agentId: agentDoc.id,
        companyId: agentData.companyId,
        createdAt: new Date(),
      };
      await setDoc(doc(db, "customers", user.uid), customerData);

      // 5. Update the package document to link it to the new customer
      await updateDoc(packageDoc.ref, {
        customerId: user.uid,
        // Status remains 'Pending' until payment is made
      });

      toast({ title: 'Success', description: 'Account created. Proceeding to checkout.' });
      sessionStorage.setItem('isCustomer', 'true');
      sessionStorage.setItem('customerName', `${firstName} ${lastName}`);
      sessionStorage.setItem('customerUid', user.uid);
      sessionStorage.setItem('customerEmail', email);
      
      const checkoutUrl = new URL(`${window.location.origin}/checkout`);
      checkoutUrl.searchParams.set('packageId', packageId);
      checkoutUrl.searchParams.set('referral', referralCode);
      router.push(checkoutUrl.toString());

    } catch (error: any) {
        let description = 'An unexpected error occurred.';
        if (error.message) {
            description = error.message;
        } else {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    description = 'This email address is already in use by another account.';
                    break;
                case 'auth/invalid-email':
                    description = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    description = 'Your password must be at least 6 characters long.';
                    break;
                default:
                    description = 'Failed to create account. Please try again.';
                    console.error("Firebase error:", error);
                    break;
            }
        }
        toast({ variant: 'destructive', title: 'Creation Failed', description });
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="pb-4 flex justify-center">
            <Image src="/logo2.png" alt="FlexBuy Logo" width={100} height={100} data-ai-hint="logo wave"/>
          </div>
          <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2"><UserPlus /> Create Your Account</CardTitle>
          <CardDescription>To purchase your package, please create an account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateAccount}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 555-5555"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {packageId && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="package-id">Package ID</Label>
                        <Input id="package-id" value={packageId} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referral-code">Referral Code</Label>
                        <Input id="referral-code" value={referralCode} disabled />
                    </div>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account & Checkout'}
            </Button>
            <Button asChild variant="link" className="w-full mt-2">
              <Link href="/customer/login">
                Already have an account? Login
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


export default function CreateAccountPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateAccountForm />
        </Suspense>
    )
}
