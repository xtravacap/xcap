"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { LogoMark } from "@/components/brand/logo-mark";

export function DashboardSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <LogoMark size={32} />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Xtrava Capital</p>
          <p className="text-sidebar-foreground/60 text-[11px]">Lender Matching</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-sidebar-border text-sidebar-foreground/50 border-t px-6 py-4 text-[11px]">
        © {new Date().getFullYear()} Xtrava Capital
      </div>
    </aside>
  );
}
