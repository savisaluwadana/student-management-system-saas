import { CommunicationForm } from '@/components/communications/CommunicationForm';
import { getCommunications } from '@/lib/actions/communications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default async function CommunicationsPage() {
  const communications = await getCommunications();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Communications
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Manage announcements and notifications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <CommunicationForm />
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <Card className="h-full border-none shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>
                Recent messages sent to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {communications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                      <Mail className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No messages yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Send your first message using the form.
                    </p>
                  </div>
                ) : (
                  communications.map((comm) => (
                    <div key={comm.id} className="flex gap-4 p-4 rounded-lg bg-white dark:bg-zinc-950 border border-border/50 hover:border-border transition-colors shadow-sm">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`p-2 rounded-full ${comm.channel === 'email' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                          {comm.channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{comm.subject || 'No Subject'}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comm.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comm.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                          <Badge variant="secondary" className="text-xs font-normal">
                            To: {comm.recipient_type}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            {getStatusIcon(comm.status)}
                            <span className="capitalize">{comm.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
