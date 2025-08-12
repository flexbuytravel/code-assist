
import { Package2 } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <Package2 className="h-full w-full" />
      </div>
    );
  }
