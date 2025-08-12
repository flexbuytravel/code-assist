
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/protected-route';

function CustomerLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
    const router = useRouter();
    const { customerData, loading, logout } = useAuth();
    
    const handleLogout = async () => {
        await logout();
        router.push('/home');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
            </div>
        );
    }

    if (!customerData) {
        return null;
    }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
            <Image src="/logo2.png" alt="FlexBuy Logo" width={32} height={32} data-ai-hint="logo wave"/>
            <h1 className="text-xl font-bold font-headline text-primary">FlexBuy Portal</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="hidden md:inline">Welcome, {customerData.name}</span>
            </div>
          <Button variant="outline" size="icon" onClick={() => router.push('/home')}>
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}


export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith('/customer/login') || pathname.startsWith('/customer/create-account')) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute loginPath="/customer/login">
        <CustomerLayoutContent>
            {children}
        </CustomerLayoutContent>
    </ProtectedRoute>
  );
}
