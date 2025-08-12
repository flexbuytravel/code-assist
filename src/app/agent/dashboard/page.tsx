
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getAgentDashboardData, AgentDashboardData } from '@/lib/data';
import { useRouter } from 'next/navigation';

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode; }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
    </div>
);
  
export default function AgentDashboardPage() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const agentUid = sessionStorage.getItem('agentUid');
        const companyId = sessionStorage.getItem('companyId');

        if (!agentUid || !companyId) {
            router.replace('/agent/login');
            return;
        }

        const result = await getAgentDashboardData(agentUid, companyId);
        setData(result);
        setLoading(false);
    };
    fetchData();
  }, [router]);


  if (loading || !data) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <StatCard title="Total Sales" value={data.totalSales} icon={<User className="h-5 w-5 text-muted-foreground" />} />
            <StatCard title="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Last 5 Sales</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Insurance</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.last5Sales.length > 0 ? data.last5Sales.map(sale => (
                        <TableRow key={sale.packageId}>
                            <TableCell>
                                <div className="font-medium">{sale.customerName}</div>
                                <div className="text-sm text-muted-foreground">{sale.packageId}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={sale.insurance !== 'None' ? 'secondary' : 'outline'}>{sale.insurance}</Badge>
                            </TableCell>
                            <TableCell>{sale.saleDate.toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-mono">${sale.amountPaid.toFixed(2)}</TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No sales yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
