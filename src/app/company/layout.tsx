
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Package,
  LineChart,
  Settings,
  Users,
  Menu,
  LayoutDashboard
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const NavLink = ({
  href,
  icon: Icon,
  children,
  pathname,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  pathname: string;
}) => {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-secondary text-secondary-foreground font-semibold'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isCompanyAdmin = sessionStorage.getItem('isCompanyAdmin') === 'true';
    if (!isCompanyAdmin && pathname !== '/company/login') {
      router.replace('/company/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router, pathname]);
  
  const handleLogout = () => {
    sessionStorage.removeItem('isCompanyAdmin');
    sessionStorage.removeItem('companyUid');
    router.push('/home');
  };

  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    if (!path || path === 'company') return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  }

  if (pathname === '/company/login') {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen"></div>;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/company/dashboard" className="flex items-center gap-2 font-semibold text-primary">
              <Image src="/logo2.png" alt="FlexBuy Logo" width={32} height={32} data-ai-hint="logo wave"/>
              <span className="font-headline">Company Portal</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink href="/company/dashboard" pathname={pathname} icon={LayoutDashboard}>
                Dashboard
              </NavLink>
              <NavLink href="/company/agents" pathname={pathname} icon={Users}>
                Agents
              </NavLink>
            </nav>
          </div>
          <div className="mt-auto p-4">
             <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
               <NavLink href="/company/settings" pathname={pathname} icon={Settings}>
                Settings
              </NavLink>
               <button
                  onClick={handleLogout}
                  className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full text-left'
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
             </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetHeader>
                  <SheetTitle>
                    <Link href="/company/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <Image src="/logo2.png" alt="FlexBuy Logo" width={32} height={32} data-ai-hint="logo wave"/>
                      <span>Company Portal</span>
                    </Link>
                  </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium">
                <NavLink href="/company/dashboard" pathname={pathname} icon={LayoutDashboard}>
                  Dashboard
                </NavLink>
                 <NavLink href="/company/agents" pathname={pathname} icon={Users}>
                    Agents
                </NavLink>
                 <NavLink href="/company/settings" pathname={pathname} icon={Settings}>
                    Settings
                </NavLink>
              </nav>
              <div className="mt-auto">
                 <nav className="grid items-start text-lg font-medium">
                    <button
                        onClick={handleLogout}
                        className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full text-left'
                        >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <div className="relative ml-auto flex-1 md:grow-0">
                <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background/80">
          {children}
        </main>
      </div>
    </div>
  );
}
