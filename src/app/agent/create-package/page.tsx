
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { getPackageDetails, Trip, getAgentPendingPackages } from '@/lib/data';
import { Copy, Ship, Home, Sun, Package, Link as LinkIcon, RefreshCw, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tripIcons: { [key: number]: React.ReactNode } = {
    1: <Home className="h-6 w-6 text-primary" />,
    2: <Ship className="h-6 w-6 text-primary" />,
    3: <Home className="h-6 w-6 text-primary" />,
    4: <Home className="h-6 w-6 text-primary" />,
    5: <Sun className="h-6 w-6 text-primary" />,
};

interface GeneratedLink {
    packageId: string;
    url: string;
}

const TripListItem = ({ trip }: { trip: Trip }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex-shrink-0">
            {tripIcons[trip.id] || <Package className="h-6 w-6 text-primary" />}
        </div>
        <div>
            <h4 className="font-semibold">{trip.title}</h4>
            <p className="text-sm text-muted-foreground">{trip.description}</p>
        </div>
    </div>
);


export default function CreatePackagePage() {
    const { toast } = useToast();
    const [price, setPrice] = useState(998);
    const [packageId, setPackageId] = useState('');
    const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
    const [basePackageTrips, setBasePackageTrips] = useState<Trip[]>([]);
    const [agentReferralCode, setAgentReferralCode] = useState('');
    const [generating, setGenerating] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    useEffect(() => {
        const agentId = sessionStorage.getItem('agentId');
        if (!agentId) {
             toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'Could not find your Agent ID. Please log in again.',
            });
            setFetching(false);
            return;
        }
        setAgentReferralCode(agentId);

        const fetchBasePackage = async () => {
            const details = await getPackageDetails('PK998A');
            if (details) {
                setBasePackageTrips(details.trips);
            }
        };

        const fetchPendingPackages = async () => {
            setFetching(true);
            const pendingPackages = await getAgentPendingPackages(agentId);
            const links = pendingPackages.map(pkg => {
                const url = new URL(`${window.location.origin}/package`);
                url.searchParams.set('packageId', pkg.packageId);
                url.searchParams.set('referral', pkg.referralCode);
                return { packageId: pkg.packageId, url: url.toString() };
            });
            setGeneratedLinks(links);
            setFetching(false);
        }

        fetchBasePackage();
        fetchPendingPackages();

    }, [toast]);

    const generateRandomId = () => {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        setPackageId(`FLEX-${randomPart}`);
    };
    
    const handleGenerateLink = async () => {
        if (!packageId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter or generate a Package ID.' });
            return;
        }
        if (!agentReferralCode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Agent Referral ID not found.' });
            return;
        }
        
        setGenerating(true);

        try {
            // Check if package ID already exists anywhere in the database
            const packagesRef = collection(db, 'packages');
            const q = query(packagesRef, where("packageId", "==", packageId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'ID Already Exists', description: 'This Package ID is already in use. Please choose a different one.' });
                setGenerating(false);
                return;
            }

            const packageData = {
                packageId: packageId,
                referralCode: agentReferralCode,
                status: 'Pending',
                price: price,
                createdAt: new Date(),
                customerId: null,
                agentId: sessionStorage.getItem('agentUid'), // Link to agent's auth UID
            };
            
            await addDoc(collection(db, "packages"), packageData);

            const url = new URL(`${window.location.origin}/package`);
            url.searchParams.set('packageId', packageId);
            url.searchParams.set('referral', agentReferralCode);
            
            const newLink: GeneratedLink = { packageId, url: url.toString() };
            setGeneratedLinks(prev => [newLink, ...prev]);
            setPackageId(''); // Clear input for next one

            toast({ title: 'Link Generated!', description: `Link for ${packageId} is now active.` });

        } catch (error) {
            console.error("Error generating link:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create package link in database.' });
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        toast({
            title: 'Link Copied!',
            description: 'The checkout link has been copied to your clipboard.',
        });
    };

    const handleDeletePackage = async (packageIdToDelete: string) => {
        try {
            const packagesRef = collection(db, 'packages');
            const q = query(packagesRef, where("packageId", "==", packageIdToDelete));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find the package to delete.' });
                return;
            }

            const packageDoc = querySnapshot.docs[0];
            await deleteDoc(packageDoc.ref);

            setGeneratedLinks(prev => prev.filter(link => link.packageId !== packageIdToDelete));
            toast({ title: 'Success', description: `Package ${packageIdToDelete} has been deleted.` });

        } catch (error) {
            console.error("Error deleting package:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the package.' });
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Create Custom Package</CardTitle>
                    <CardDescription>
                        Set a price and generate a unique link for your customer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="package-id">Custom Package ID</Label>
                        <div className="flex gap-2">
                             <Input 
                                id="package-id"
                                placeholder="E.g., CUST-JOHN-DOE"
                                value={packageId}
                                onChange={(e) => setPackageId(e.target.value.toUpperCase())}
                                disabled={generating}
                            />
                            <Button variant="outline" size="icon" onClick={generateRandomId} disabled={generating}>
                                <RefreshCw className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="price">Promotional Price: <span className="text-primary font-bold text-lg">${price}</span></Label>
                        <Slider 
                            id="price"
                            min={798}
                            max={1298}
                            step={10}
                            value={[price]}
                            onValueChange={(value) => setPrice(value[0])}
                            disabled={generating}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>$798</span>
                            <span>$1298</span>
                        </div>
                    </div>
                    
                    <Button onClick={handleGenerateLink} className="w-full" disabled={generating}>
                        {generating ? 'Generating...' : <><LinkIcon className="mr-2"/>Generate Link</>}
                    </Button>
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Active Customer Links</CardTitle>
                    <CardDescription>
                        These are unclaimed package links you've generated.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Package ID</TableHead>
                                <TableHead>Customer Link</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fetching ? (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Skeleton className="h-10" />
                                    </TableCell>
                                </TableRow>
                            ) : generatedLinks.length > 0 ? (
                                generatedLinks.map((link) => (
                                    <TableRow key={link.packageId}>
                                        <TableCell className="font-mono">{link.packageId}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{link.url}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleCopyLink(link.url)}>
                                                <Copy className="mr-2 h-3 w-3" />
                                                Copy
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="mr-2 h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the package link for <span className="font-mono font-semibold">{link.packageId}</span>. The customer will not be able to use this link to purchase.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeletePackage(link.packageId)}>
                                                        Yes, delete it
                                                    </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        No active links found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Base Package Contents:</h3>
                 {basePackageTrips.length > 0 ? basePackageTrips.map(trip => (
                    <TripListItem key={trip.id} trip={trip} />
                )) : <p>Loading package details...</p>}
            </div>
        </div>
    );
}
