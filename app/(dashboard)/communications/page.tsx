import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="text-muted-foreground">Send emails and SMS to students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Dashboard</CardTitle>
          <CardDescription>
            Send messages and view communication history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Communication features will be implemented here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
