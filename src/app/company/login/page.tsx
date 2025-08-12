
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Building } from 'lucide-react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CompanyLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const companyDocRef = doc(db, "companies", user.uid);
      const companyDocSnap = await getDoc(companyDocRef);

      if (!companyDocSnap.exists()) {
        throw { code: 'auth/not-a-company-admin' };
      }
      
      sessionStorage.setItem('isCompanyAdmin', 'true');
      sessionStorage.setItem('companyUid', userCredential.user.uid); 
      router.push('/company/dashboard');

    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      switch (error.code) {
        case 'auth/invalid-email':
          description = 'The email address is not valid.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
           description = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
           description = 'Access to this account has been temporarily disabled due to many failed login attempts.';
           break;
        case 'auth/not-a-company-admin':
          description = 'This account does not have company portal access.';
          break;
        default:
          description = 'Login failed. Please try again.';
          break;
      }
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-sm shadow-2xl bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <div className="pb-4 flex justify-center">
              <Image src="/logo2.png" alt="FlexBuy Logo" width={100} height={100} data-ai-hint="logo wave"/>
            </div>
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2"><Building /> Company Login</CardTitle>
            <CardDescription>Access your company's sales dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-id">Company Login Email</Label>
                <Input
                  id="company-id"
                  type="email"
                  placeholder="Enter your Company Login Email"
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
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button asChild variant="link" className="w-full mt-2">
                <Link href="/home">
                  Back to Home
                </Link>
              </Button>
            </CardFooter>
          </form>
      </Card>
    </div>
  );
}
