import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex h-full">
          <Sidebar user={user} />
        </div>
        <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
