import { getClasses } from '@/lib/actions/classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/formatters';

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Manage your classes and batches</p>
        </div>
        <Link href="/classes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          <CardDescription>
            A list of all classes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No classes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.class_code}</TableCell>
                    <TableCell>{cls.class_name}</TableCell>
                    <TableCell>{cls.subject}</TableCell>
                    <TableCell>{formatCurrency(cls.monthly_fee)}</TableCell>
                    <TableCell>{cls.capacity}</TableCell>
                    <TableCell>
                      <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                        {cls.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
