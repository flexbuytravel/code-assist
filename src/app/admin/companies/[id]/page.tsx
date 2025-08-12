
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Mail, Phone, User, Users, DollarSign, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Company {
    id: string;
    name: string;
    ownerName: string;
    email: string;
    address: string;
    phone: string;
    createdAt: Date;
}

interface Agent {
    id: string;
    name: string;
    sales: number;
    revenue: number;
}


const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'N/A'}</p>
        </div>
    </div>
);

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default function CompanyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [company, setCompany] = useState<Company | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [totalSales, setTotalSales] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    const companyId = params.id as string;

    useEffect(() => {
        if (companyId) {
            const fetchCompanyData = async () => {
                setLoading(true);
                try {
                    // Fetch company details
                    const docRef = doc(db, 'companies', companyId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setCompany({ id: docSnap.id, ...docSnap.data() } as Company);
                    } else {
                        toast({ variant: 'destructive', title: 'Error', description: 'Company not found.' });
                        router.push('/admin/companies');
                        return;
                    }

                    // Fetch agents for the company
                    const agentsQuery = query(collection(db, 'agents'), where('companyId', '==', companyId));
                    const agentsSnapshot = await getDocs(agentsQuery);
                    const agentsList: Agent[] = [];
                    
                    let allSales = 0;
                    let allRevenue = 0;

                    for (const agentDoc of agentsSnapshot.docs) {
                        const agentData = agentDoc.data();
                        
                        // Fetch packages for each agent
                        const packagesQuery = query(collection(db, 'packages'), where('agentId', '==', agentDoc.id), where('status', '==', 'Paid'));
                        const packagesSnapshot = await getDocs(packagesQuery);
                        
                        const agentSales = packagesSnapshot.size;
                        const agentRevenue = packagesSnapshot.docs.reduce((sum, pkgDoc) => sum + (pkgDoc.data().pricePaid || 0), 0);
                        
                        allSales += agentSales;
                        allRevenue += agentRevenue;

                        agentsList.push({
                            id: agentDoc.id,
                            name: agentData.name,
                            sales: agentSales,
                            revenue: agentRevenue
                        });
                    }
                    setAgents(agentsList.sort((a, b) => b.revenue - a.revenue));
                    setTotalSales(allSales);
                    setTotalRevenue(allRevenue);

                } catch (error) {
                    console.error("Error fetching company details: ", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch company details.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchCompanyData();
        }
    }, [companyId, router, toast]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
                 <Skeleton className="h-64" />
            </div>
        )
    }

    if (!company) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Companies
                </Button>
            </div>
           
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Building className="h-8 w-8 text-primary"/>
                        <div>
                            <CardTitle className="text-3xl">{company.name}</CardTitle>
                            <CardDescription>Company ID: {company.id}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <DetailItem icon={User} label="Owner Name" value={company.ownerName} />
                     <DetailItem icon={Mail} label="Login Email" value={company.email} />
                     <DetailItem icon={Phone} label="Phone Number" value={company.phone} />
                     <DetailItem icon={Building} label="Address" value={company.address} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Agents" value={agents.length} icon={Users} />
                <StatCard title="Total Sales" value={totalSales.toLocaleString()} icon={Package} />
                <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Agents</CardTitle>
                    <CardDescription>
                        A list of all agents associated with {company.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>Total Sales</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agents.length > 0 ? agents.map(agent => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">{agent.name}</TableCell>
                                    <TableCell>{agent.sales}</TableCell>
                                    <TableCell className="text-right">${agent.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No agents found for this company yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
