
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLoginPage() {
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
      
      sessionStorage.setItem('isAdmin', 'true');
      sessionStorage.setItem('adminName', userCredential.user.email || 'Platform Admin');
      router.push('/admin/dashboard');

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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/20 to-background p-4">
      <Card className="w-full max-w-sm shadow-2xl border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="pb-4 flex justify-center">
              <Image src="/logo2.png" alt="FlexBuy Logo" width={100} height={100} data-ai-hint="logo wave" />
            </div>
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2"><Shield /> Admin Login</CardTitle>
            <CardDescription>Access the platform-wide dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
