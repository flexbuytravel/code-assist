
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


interface Company {
    id: string;
    name: string;
    ownerName: string;
    email: string;
    address: string;
    phone: string;
    createdAt: Date;
    agentCount: number;
    totalSales: number;
}

export default function CompaniesPage() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [fetching, setFetching] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchCompanies = async () => {
            setFetching(true);
            try {
                const companiesSnapshot = await getDocs(collection(db, "companies"));
                const companiesList = await Promise.all(companiesSnapshot.docs.map(async (companyDoc) => {
                    const companyData = companyDoc.data();
                    
                    const agentsQuery = query(collection(db, "agents"), where("companyId", "==", companyDoc.id));
                    const agentsSnapshot = await getDocs(agentsQuery);
                    const agentCount = agentsSnapshot.size;

                    // This is a simplification. A real app might need to aggregate sales across all agents.
                    // For now, we are showing 0 as calculating it here would be too intensive.
                    const totalSales = 0; 

                    return {
                        id: companyDoc.id,
                        ...companyData,
                        agentCount,
                        totalSales,
                    } as Company;
                }));

                setCompanies(companiesList);
            } catch (error) {
                console.error("Error fetching companies: ", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch companies.' });
            } finally {
                setFetching(false);
            }
        };

        fetchCompanies();
    }, [toast]);


    const handleAddCompany = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        
        const companyName = formData.get('company-name') as string;
        const ownerName = formData.get('owner-name') as string;
        const companyIdEmail = formData.get('company-id') as string;
        const address = formData.get('address') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirm-password') as string;

        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, companyIdEmail, password);
            const user = userCredential.user;

            const companyData: Omit<Company, 'id' | 'agentCount' | 'totalSales' | 'createdAt'> & { createdAt: Date } = {
                name: companyName,
                ownerName: ownerName,
                email: companyIdEmail,
                address: address,
                phone: phone,
                createdAt: new Date(),
            };
            
            await setDoc(doc(db, "companies", user.uid), companyData);

            // Add the new company to the local state to update the UI
            setCompanies(prev => [...prev, { id: user.uid, ...companyData, agentCount: 0, totalSales: 0 }]);

            toast({ title: 'Success', description: 'Company account created successfully.' });
            setOpen(false);

        } catch (error: any) {
            let description = 'An unexpected error occurred.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    description = 'This Company ID (email) is already in use.';
                    break;
                case 'auth/invalid-email':
                    description = 'The Company ID must be a valid email address.';
                    break;
                case 'auth/weak-password':
                    description = 'The password is too weak. It must be at least 6 characters long.';
                    break;
                default:
                    description = 'Failed to create company. Please try again.';
                    console.error("Firebase error:", error);
                    break;
            }
            toast({ variant: 'destructive', title: 'Creation Failed', description });
        } finally {
            setLoading(false);
        }
    }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Company Management</CardTitle>
            <CardDescription>
            View, add, or manage companies on the platform.
            </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Company
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new company account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCompany}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company-name">Company Name</Label>
                                <Input id="company-name" name="company-name" placeholder="E.g., Travel Experts Inc." required disabled={loading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="owner-name">Owner</Label>
                                <Input id="owner-name" name="owner-name" placeholder="E.g., John Smith" required disabled={loading} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="company-id">Unique Company ID (Login Email)</Label>
                            <Input id="company-id" name="company-id" type="email" placeholder="company@flexbuy.com" required disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" placeholder="123 Main St, Anytown, USA" required disabled={loading} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" required disabled={loading} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input id="confirm-password" name="confirm-password" type="password" required disabled={loading} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Company'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fetching ? (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex justify-center items-center">
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-8" />
                                    <Skeleton className="h-8" />
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : companies.length > 0 ? companies.map(company => (
                    <TableRow key={company.id}>
                        <TableCell className="font-semibold">{company.name}</TableCell>
                        <TableCell>{company.ownerName}</TableCell>
                        <TableCell>{company.agentCount}</TableCell>
                        <TableCell>{company.totalSales.toLocaleString()}</TableCell>
                        <TableCell>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/companies/${company.id}`}>View Details</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No companies found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
