import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { getCurrentUser } from '@/lib/auth/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Transform JWT payload to match the shape expected by Navbar/Sidebar
  const userForLayout = user
    ? {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.full_name, role: user.role },
      }
    : null;

  return (
    <div className="h-screen flex flex-col">
      <Navbar user={userForLayout} />
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex h-full">
          <Sidebar user={userForLayout} />
        </div>
        <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
