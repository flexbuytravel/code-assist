
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardSkeleton } from '@/app/agent/dashboard/page';

interface ProtectedRouteProps {
  children: React.ReactNode;
  loginPath: string;
}

export default function ProtectedRoute({ children, loginPath }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(loginPath);
    }
  }, [user, loading, router, loginPath]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
           <DashboardSkeleton />
        </main>
     </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return null;
}
