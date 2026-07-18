"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

import type { NavItem } from "@/lib/nav";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { CommandPalette } from "@/components/search/command-palette";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/utils";
import type { Role } from "@prisma/client";

export function DashboardTopbar({ items, role }: { items: NavItem[]; role: Role }) {
  const pathname = usePathname();
  const current = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {items.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>
                  <item.icon /> {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h1 className="hidden text-sm font-semibold sm:block">{current?.label ?? "Dashboard"}</h1>
      <Badge variant="outline" className="hidden sm:inline-flex">
        {titleCase(role)}
      </Badge>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <div className="hidden max-w-sm flex-1 md:block">
          <CommandPalette />
        </div>
        <NotificationsBell />
        <ThemeToggle />
        <UserButton afterSwitchSessionUrl="/sign-in" />
      </div>
    </header>
  );
}
