
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User, LayoutDashboard, List, Settings, PackagePlus, Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from './dashboard/page';
import ProtectedRoute from '@/components/protected-route';

const NavButton = ({ href, icon: Icon, children, currentPath }: { href: string; icon: React.ElementType; children: React.ReactNode; currentPath: string; }) => {
    const isActive = currentPath.startsWith(href);
    return (
        <Button asChild variant={isActive ? 'secondary' : 'ghost'} className="flex flex-col h-full justify-center w-full">
            <Link href={href}>
                <Icon className="h-6 w-6"/>
                <span className="text-xs">{children}</span>
            </Link>
        </Button>
    )
}

function AgentLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { agentData, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/home');
  };

  if (!agentData) {
      return (
         <div className="flex flex-col min-h-screen w-full bg-muted/40">
             <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <User className="h-6 w-6"/>
                    <div>
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-48 mt-1 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
                 <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
               <DashboardSkeleton />
            </main>
         </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <div className="flex items-center gap-4">
                <User className="h-6 w-6"/>
                <div>
                    <h1 className="text-xl font-bold font-headline">{agentData.name}</h1>
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground">{agentData.companyName} (ID: {agentData.referralCode})</p>
                    </div>
                </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>

      <footer className="sticky bottom-0 z-30 flex justify-around h-16 items-center gap-1 border-t bg-background px-2">
        <NavButton href="/agent/dashboard" currentPath={pathname} icon={LayoutDashboard}>Dashboard</NavButton>
        <NavButton href="/agent/create-package" currentPath={pathname} icon={PackagePlus}>Create</NavButton>
        <NavButton href="/agent/customers" currentPath={pathname} icon={List}>Customers</NavButton>
        <NavButton href="/agent/settings" currentPath={pathname} icon={Settings}>Settings</NavButton>
      </footer>
    </div>
  );
}


export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();

    if (pathname === '/agent/login') {
      return <>{children}</>;
    }
    
    return (
        <ProtectedRoute loginPath="/agent/login">
            <AgentLayoutContent>
                {children}
            </AgentLayoutContent>
        </ProtectedRoute>
    );
}
