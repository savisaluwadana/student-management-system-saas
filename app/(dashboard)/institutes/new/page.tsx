import { InstituteForm } from '@/components/institutes/InstituteForm';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewInstitutePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/institutes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-primary" />
                        Add New Institute
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create a new educational institute
                    </p>
                </div>
            </div>

            <InstituteForm />
        </div>
    );
}
