
'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboardData, AdminDashboardData } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Package, Users, Trophy, DollarSign } from 'lucide-react';

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

const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
       <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
)

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAdminDashboardData();
      setData(result);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
            <StatCard title="Total Sales" value={data.totalSales.toLocaleString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} description="Across all companies"/>
            <StatCard title="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Across all companies"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Top 5 Companies by Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead className="text-right">Sales</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.topCompanies.map(company => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.name}</TableCell>
                                    <TableCell className="text-right">{company.totalSales.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${company.totalRevenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Top 5 Agents by Sales</CardTitle>
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
                            {data.topAgents.map((agent, index) => (
                                <TableRow key={agent.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {index < 3 && <Trophy className={`h-4 w-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-700'}`} />}
                                            <div>
                                                <div className="font-medium">{agent.name}</div>
                                                <div className="text-sm text-muted-foreground">{agent.companyName}</div>
                                            </div>
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
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>All Companies</CardTitle>
                <CardDescription>A complete list of all companies on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Agents</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.allCompanies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.agents}</TableCell>
                                <TableCell className="text-right">{company.totalSales.toLocaleString()}</TableCell>
                                <TableCell className="text-right">${company.totalRevenue.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    </div>
  );
}
