import { getInstituteSummaries } from '@/lib/actions/institutes';
import { InstituteList } from '@/components/institutes/InstituteList';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import Link from 'next/link';

export default async function InstitutesPage() {
    const institutes = await getInstituteSummaries();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-primary" />
                        Institutes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your educational institutes
                    </p>
                </div>
                <Link href="/institutes/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Institute
                    </Button>
                </Link>
            </div>

            <InstituteList institutes={institutes} />
        </div>
    );
}
