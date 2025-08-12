
'use client';

import { useEffect, useState } from 'react';
import { getAgentCustomers, AgentCustomer } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniCountdownTimer } from '@/components/mini-countdown-timer';
import { User, Mail, Phone, Package, Shield, Calendar, DollarSign, Hourglass, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CustomersSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
             <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        </CardContent>
    </Card>
)

const CustomerDetailItem = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string, children?: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {value && <p className="font-medium">{value}</p>}
            {children}
        </div>
    </div>
);


export default function CustomersPage() {
    const [customers, setCustomers] = useState<AgentCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const agentUid = sessionStorage.getItem('agentUid');
            
            if (!agentUid) {
                toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: 'Could not find your Agent ID. Please log in again.',
                });
                setLoading(false);
                return;
            }

            const data = await getAgentCustomers(agentUid);
            setCustomers(data);
            setLoading(false);
        };
        fetchData();
    }, [toast]);

    if (loading) {
        return <CustomersSkeleton />;
    }
    
    const getStatusBadge = (status: AgentCustomer['status']) => {
        switch(status) {
            case 'Paid': return <Badge variant="default">Paid</Badge>;
            case 'Pending': return <Badge variant="secondary">Pending</Badge>;
            case 'Deposit Paid': return <Badge variant="outline" className="border-blue-500 text-blue-500">Deposit Paid</Badge>;
            default: return <Badge variant="destructive">{status}</Badge>;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Customers</CardTitle>
                <CardDescription>
                    A list of all customers who have registered using your referral code. Click a row to see details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Insurance</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Info</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length > 0 ? customers.map(customer => (
                            <Dialog key={customer.id}>
                                <DialogTrigger asChild>
                                    <TableRow className="cursor-pointer">
                                        <TableCell>
                                            <div className="font-medium">{customer.name}</div>
                                            <div className="text-sm text-muted-foreground font-mono">{customer.packageId}</div>
                                        </TableCell>
                                        <TableCell>
                                           {getStatusBadge(customer.status)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={customer.insurance !== 'None' ? 'secondary' : 'outline'}>{customer.insurance}</Badge>
                                        </TableCell>
                                        <TableCell>{customer.joinDate.toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            {customer.status === 'Paid' ? (
                                                <span className="font-mono">${customer.pricePaid.toFixed(2)}</span>
                                            ) : customer.status === 'Pending' ? (
                                                <MiniCountdownTimer packageId={customer.packageId} />
                                            ) : customer.status === 'Deposit Paid' && customer.paymentDueDate ? (
                                                 <span className="text-xs text-blue-600 font-medium">Due: {customer.paymentDueDate.toLocaleDateString()}</span>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2"><User /> {customer.name}</DialogTitle>
                                        <DialogDescription>
                                            Detailed information for this customer.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <CustomerDetailItem icon={Mail} label="Email" value={customer.email} />
                                        <CustomerDetailItem icon={Phone} label="Phone" value={customer.phone} />
                                        <CustomerDetailItem icon={Package} label="Package ID" value={customer.packageId} />
                                        <CustomerDetailItem icon={Shield} label="Insurance" value={customer.insurance} />
                                        <CustomerDetailItem icon={Calendar} label="Join Date" value={customer.joinDate.toLocaleDateString()} />
                                         
                                        {customer.status === 'Paid' ? (
                                            <CustomerDetailItem icon={DollarSign} label="Price Paid" value={`$${customer.pricePaid.toFixed(2)}`} />
                                         ) : customer.status === 'Deposit Paid' ? (
                                            <>
                                                <CustomerDetailItem icon={DollarSign} label="Deposit Paid" value={`$${customer.depositPaid.toFixed(2)}`} />
                                                {customer.paymentDueDate && (
                                                    <CustomerDetailItem icon={CalendarClock} label="Balance Due Date" value={customer.paymentDueDate.toLocaleDateString()} />
                                                )}
                                            </>
                                         ) : (
                                            <CustomerDetailItem icon={Hourglass} label="Time Left to Pay">
                                                <MiniCountdownTimer packageId={customer.packageId} className="justify-start text-base" />
                                            </CustomerDetailItem>
                                         )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No customers found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
