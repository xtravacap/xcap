import type { Role } from "@prisma/client";
import {
  BarChart3,
  Building2,
  FileStack,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

/** Sidebar nav, filtered per-role in the dashboard shell. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "LENDER", "BORROWER"] },
  { label: "Borrowers", href: "/borrowers", icon: Users, roles: ["ADMIN"] },
  { label: "Lenders", href: "/lenders", icon: Building2, roles: ["ADMIN", "LENDER"] },
  { label: "Loan Programs", href: "/loan-programs", icon: FileStack, roles: ["ADMIN", "LENDER"] },
  { label: "Matches", href: "/matches", icon: Workflow, roles: ["ADMIN", "LENDER", "BORROWER"] },
  { label: "Documents", href: "/documents", icon: FolderOpen, roles: ["ADMIN", "BORROWER"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN"] },
  { label: "Apply", href: "/apply", icon: Sparkles, roles: ["BORROWER"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN", "LENDER", "BORROWER"] },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
