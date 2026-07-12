"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Menu as MenuIcon, Utensils, ListOrdered, Table, BarChart3, LogOut, PanelLeft } from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Menu", href: "/menu", icon: Utensils },
  { name: "Orders", href: "/orders", icon: ListOrdered },
  { name: "Tables", href: "/tables", icon: Table },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6 font-semibold tracking-tight">SMMS</div>
        <nav className="flex-1 space-y-1 p-4">
          <NavItems />
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 text-sm text-muted-foreground">{user?.email}</div>
          <Button variant="outline" className="w-full" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:justify-end">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <PanelLeft className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-6 font-semibold">SMMS</div>
              <nav className="space-y-1 p-4">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="hidden lg:inline-flex">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
