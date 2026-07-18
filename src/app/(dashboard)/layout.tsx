import { requireUser } from "@/lib/auth";
import { navItemsForRole } from "@/lib/nav";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = navItemsForRole(user.role);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar items={items} role={user.role} />
        <main className="flex-1 space-y-6 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
