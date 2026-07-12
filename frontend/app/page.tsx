import { ArrowRight, QrCode, Radio, ShieldCheck, Utensils } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const features = [
  { icon: QrCode, title: "Scan", caption: "Open menu" },
  { icon: ShieldCheck, title: "Order", caption: "Secure cart" },
  { icon: Radio, title: "Track", caption: "Live status" },
];

export default function Home() {
  return (
    <main className="surface-grid min-h-dvh">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Utensils className="size-4" />
          </span>
          Smart Mess
        </div>
        <ThemeToggle />
      </nav>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            <Radio className="size-3.5 text-primary" />
            Live ordering, without the paper trail
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Faster service for every table and takeaway order.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Customers scan, order and track. Owners manage the menu, live queue,
            tables and daily performance from one focused workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/order/standing" />}>
              Preview customer ordering <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/admin/login" />}
            >
              Open owner dashboard
            </Button>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-4 shadow-2xl shadow-primary/10">
          <div className="rounded-2xl bg-muted/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="mt-1 text-3xl font-semibold">42 orders</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Live
              </span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {features.map(({ icon: Icon, title, caption }) => (
                <div key={title} className="rounded-xl border bg-background p-4">
                  <Icon className="size-5 text-primary" />
                  <p className="mt-4 font-medium">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
