
'use client';

import { useEffect, useState } from 'react';
import { getPackageDetails, PackageDetails, Trip } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Ship, Home, Sun, Package, Edit, Trash2, PlusCircle } from 'lucide-react';

const tripIcons: { [key: number]: React.ReactNode } = {
    1: <Home className="h-6 w-6 text-primary" />,
    2: <Ship className="h-6 w-6 text-primary" />,
    3: <Home className="h-6 w-6 text-primary" />,
    4: <Home className="h-6 w-6 text-primary" />,
    5: <Sun className="h-6 w-6 text-primary" />,
};

const TripListItem = ({ trip }: { trip: Trip }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
        <div className="flex-shrink-0">
            {tripIcons[trip.id] || <Package className="h-6 w-6 text-primary" />}
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold">{trip.title}</h4>
            <p className="text-sm text-muted-foreground">{trip.description}</p>
        </div>
        <div className="flex gap-2">
             <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit Trip</span>
            </Button>
             <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
                 <span className="sr-only">Remove Trip</span>
            </Button>
        </div>
    </div>
);


const PackageSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
        </CardContent>
    </Card>
)

export default function PackagesPage() {
    const { toast } = useToast();
    const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const packageId = 'PK998A';

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const details = await getPackageDetails(packageId);
            setPackageDetails(details);
            setLoading(false);
        };
        fetchDetails();
    }, []);

    if (loading) {
        return <PackageSkeleton />;
    }

    if (!packageDetails) {
        return <p>Could not load package details.</p>
    }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl font-headline">{packageDetails.name}</CardTitle>
                <CardDescription>
                Manage the trips included in the promotional package.
                </CardDescription>
            </div>
            <Button variant="outline">
                <Edit className="mr-2 h-4 w-4"/>
                Edit Details
            </Button>
        </div>
      </CardHeader>
      <CardContent>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Included Trips:</h3>
                {packageDetails.trips.map(trip => (
                    <TripListItem key={trip.id} trip={trip} />
                ))}
            </div>
            <div className="mt-6">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Trip
                </Button>
            </div>
      </CardContent>
    </Card>
  );
}
