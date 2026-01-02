import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
    const data = await getDashboardData();

    return <DashboardContent data={data} />;
}
