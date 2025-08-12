
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

export default function AgentSettingsPage() {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would update the agent's profile in Firestore.
        toast({
            title: "Profile Updated",
            description: "Your name and email have been saved.",
        });
    }

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        // This would call a secure Firebase function to update the password.
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your name and contact email.</CardDescription>
                </CardHeader>
                <form onSubmit={handleProfileUpdate}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your.email@example.com" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Save Profile</Button>
                    </CardFooter>
                </form>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>For security, please choose a strong password.</CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordUpdate}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Update Password</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
