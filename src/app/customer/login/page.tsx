
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, 'customer');
      router.push('/customer/dashboard');

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
            case 'auth/not-a-customer':
                description = 'This user account is not registered as a customer.';
                break;
            default:
            description = 'Login failed. Please try again.';
            console.error(error);
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
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2"><User /> Customer Login</CardTitle>
            <CardDescription>Access your dashboard to view your packages.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                      href="#"
                      className="text-sm text-primary hover:underline"
                  >
                      Forgot Password?
                  </Link>
                </div>
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
                {loading ? 'Logging in...' : 'Login'}
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
