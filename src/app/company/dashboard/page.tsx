
'use client';

import { useEffect, useState } from 'react';
import { getCompanyDashboardData, CompanyDashboardData } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Users, Package, TrendingUp, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

function StatCard({ title, value, icon, description }: { title: string; value: string | number; icon: React.ReactNode; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function CompanyDashboardPage() {
  const [data, setData] = useState<CompanyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const companyId = sessionStorage.getItem('companyUid');
        if (!companyId) {
          router.replace('/company/login');
          return;
        }

        const result = await getCompanyDashboardData(companyId);
        setData(result);
        setLoading(false);
    };
    fetchData();
  }, [router]);

  const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
      </div>
    </div>
  )

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Packages Sold" value={data.totalPackagesSold.toLocaleString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Active Agents" value={data.activeAgents} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Total Sales" value={data.totalSales.toLocaleString()} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Agent Leaderboard</CardTitle>
            <CardDescription>Top performing agents by revenue.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.agentLeaderboard.map((agent, index) => (
                        <TableRow key={agent.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     {index < 3 && <Trophy className={`h-4 w-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-700'}`} />}
                                    <span className="font-medium">{agent.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">{agent.totalSales.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${agent.totalRevenue.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
               <CardDescription>Your company's last 10 sales.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {data.recentSales.map((sale, index) => (
                  <TableRow key={index}>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.agentName}</TableCell>
                      <TableCell className="text-right">${sale.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                  ))}
              </TableBody>
              </Table>
          </CardContent>
      </Card>
      </div>
    </div>
  );
}
