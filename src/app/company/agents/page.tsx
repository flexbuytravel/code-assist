
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


interface Agent {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    sales: number;
    status: 'Active' | 'Inactive';
    companyId: string;
}


export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const { toast } = useToast();

    // State for editing agent
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    // State for deactivating agent
    const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
    const [deactivatingAgent, setDeactivatingAgent] = useState<Agent | null>(null);

    useEffect(() => {
        const companyId = sessionStorage.getItem('companyUid');
        if (!companyId) {
            setFetching(false);
            return;
        };

        const fetchAgents = async () => {
            setFetching(true);
            try {
                const q = query(collection(db, "agents"), where("companyId", "==", companyId));
                const querySnapshot = await getDocs(q);
                
                const agentsListPromises = querySnapshot.docs.map(async (agentDoc) => {
                    const agentData = agentDoc.data();
                    
                    // Fetch sales count for each agent
                    const packagesQuery = query(collection(db, 'packages'), where('agentId', '==', agentDoc.id), where('status', '==', 'Paid'));
                    const packagesSnapshot = await getDocs(packagesQuery);
                    const salesCount = packagesSnapshot.size;

                    return {
                        id: agentDoc.id,
                        sales: salesCount,
                        ...agentData
                    } as Agent;
                });
                
                const agentsList = await Promise.all(agentsListPromises);

                setAgents(agentsList.sort((a,b) => a.name.localeCompare(b.name)));
            } catch (error) {
                console.error("Error fetching agents: ", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch agents.' });
            } finally {
                setFetching(false);
            }
        };

        fetchAgents();
    }, [toast]);

    const handleAddAgent = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const companyId = sessionStorage.getItem('companyUid');
        if (!companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not identify your company. Please log in again.' });
            setLoading(false);
            return;
        }

        const formData = new FormData(event.currentTarget);
        const name = `${formData.get('first-name')} ${formData.get('last-name') || ''}`.trim();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const referralCode = formData.get('referral-code') as string;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const newAgentData: Omit<Agent, 'id' | 'sales'> = {
                name: name,
                email: email,
                referralCode: referralCode,
                status: 'Active',
                companyId: companyId,
            };

            await setDoc(doc(db, "agents", user.uid), newAgentData);

            setAgents(prev => [...prev, { id: user.uid, sales: 0, ...newAgentData }].sort((a,b) => a.name.localeCompare(b.name)));

            toast({
                title: 'Agent Created',
                description: `Agent ${name} has been added successfully.`,
            });
            setOpen(false);
            (event.target as HTMLFormElement).reset();


        } catch (error: any) {
            let description = 'An unexpected error occurred.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    description = 'This email is already in use by another agent.';
                    break;
                case 'auth/invalid-email':
                    description = 'The email address is not valid.';
                    break;
                case 'auth/weak-password':
                    description = 'The password is too weak. It must be at least 6 characters long.';
                    break;
                default:
                    description = 'Failed to create agent. Please try again.';
                    console.error("Firebase error:", error);
                    break;
            }
            toast({ variant: 'destructive', title: 'Creation Failed', description });
        } finally {
            setLoading(false);
        }
    };
    
    const handleEditClick = (agent: Agent) => {
        setEditingAgent(agent);
        setIsEditDialogOpen(true);
    };

    const handleUpdateAgent = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingAgent) return;
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const updatedData = {
            name: formData.get('edit-name') as string,
            referralCode: formData.get('edit-referral-code') as string,
        };

        try {
            const agentRef = doc(db, 'agents', editingAgent.id);
            await updateDoc(agentRef, updatedData);

            setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, ...updatedData } : a).sort((a,b) => a.name.localeCompare(b.name)));

            toast({ title: 'Success', description: 'Agent details updated.' });
            setIsEditDialogOpen(false);
            setEditingAgent(null);
        } catch (error) {
            console.error("Error updating agent:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update agent.' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeactivateClick = (agent: Agent) => {
        setDeactivatingAgent(agent);
        setIsDeactivateDialogOpen(true);
    }
    
    const handleDeactivateAgent = async () => {
        if (!deactivatingAgent) return;

        const newStatus = deactivatingAgent.status === 'Active' ? 'Inactive' : 'Active';
        try {
            const agentRef = doc(db, 'agents', deactivatingAgent.id);
            await updateDoc(agentRef, { status: newStatus });
            
            setAgents(prev => prev.map(a => a.id === deactivatingAgent.id ? { ...a, status: newStatus } : a).sort((a,b) => a.name.localeCompare(b.name)));
            
            toast({ title: 'Success', description: `Agent has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update agent status.' });
            console.error("Error updating agent status:", error);
        } finally {
            setIsDeactivateDialogOpen(false);
            setDeactivatingAgent(null);
        }
    }


    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Agents</CardTitle>
                        <CardDescription>
                            Manage your company's sales agents.
                        </CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2" />
                                Add New Agent
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Agent</DialogTitle>
                                <DialogDescription>
                                    Fill out the form to add a new agent to your company.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddAgent}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first-name">First Name</Label>
                                            <Input id="first-name" name="first-name" placeholder="John" required disabled={loading} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last-name">Last Name (Optional)</Label>
                                            <Input id="last-name" name="last-name" placeholder="Doe" disabled={loading} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Agent Login Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="agent@email.com" required disabled={loading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required disabled={loading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="referral-code">Referral Code / Agent ID</Label>
                                        <Input id="referral-code" name="referral-code" placeholder="Enter a unique code" required disabled={loading} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Agent'}
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
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Referral Code</TableHead>
                                <TableHead>Total Sales</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fetching ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <div className="space-y-2 p-4">
                                            <Skeleton className="h-8" />
                                            <Skeleton className="h-8" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : agents.length > 0 ? (
                                agents.map(agent => (
                                    <TableRow key={agent.id}>
                                        <TableCell className="font-medium">{agent.name}</TableCell>
                                        <TableCell>{agent.email}</TableCell>
                                        <TableCell>{agent.referralCode}</TableCell>
                                        <TableCell>{agent.sales}</TableCell>
                                        <TableCell>
                                            <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>{agent.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(agent)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeactivateClick(agent)}>
                                                        {agent.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No agents found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Agent Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Agent</DialogTitle>
                        <DialogDescription>Update the details for {editingAgent?.name}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAgent}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Agent Name</Label>
                                <Input id="edit-name" name="edit-name" defaultValue={editingAgent?.name} required disabled={loading}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="edit-email">Login Email</Label>
                                <Input id="edit-email" name="edit-email" type="email" defaultValue={editingAgent?.email} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-referral-code">Referral Code</Label>
                                <Input id="edit-referral-code" name="edit-referral-code" defaultValue={editingAgent?.referralCode} required disabled={loading}/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Deactivate Agent Alert Dialog */}
             <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will {deactivatingAgent?.status === 'Active' ? 'deactivate' : 'activate'} the agent account for
                        <span className="font-semibold"> {deactivatingAgent?.name}</span>.
                        {deactivatingAgent?.status === 'Active' ? ' They will not be able to log in or make sales.' : ' They will regain access to their account.'}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivateAgent}>
                        {deactivatingAgent?.status === 'Active' ? 'Yes, Deactivate' : 'Yes, Activate'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
