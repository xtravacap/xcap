import Link from "next/link";
import { ArrowRight, Building2, LineChart, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-scored lender matches",
    description:
      "Every submission is scored 0-100 against every active loan program on loan amount, DSCR, LTV/LTC, credit, experience, and more.",
  },
  {
    icon: Building2,
    title: "One database, every lender program",
    description: "Unlimited loan programs per lender, structured guidelines, and instant search across your whole capital network.",
  },
  {
    icon: LineChart,
    title: "A pipeline you can see",
    description: "Track submissions from intake to introduction to funded loan, with analytics on conversion and lender performance.",
  },
  {
    icon: ShieldCheck,
    title: "Built for the deal team",
    description: "Role-based access for admins, lenders, and borrowers — with document tracking and audit-ready activity logs.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-2 font-semibold">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            X
          </div>
          Xtrava Capital
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">
              Get started <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
          <div className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" /> Automated CRE lender matching
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Match every borrower with the right lender — automatically.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-balance">
            Xtrava Capital&apos;s platform scores every loan request against your entire lender network in seconds,
            so your team spends time closing deals — not spreadsheets.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/apply">
                Submit a loan request <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Xtrava team &amp; lender login</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="glass-panel">
              <CardHeader>
                <feature.icon className="text-primary mb-2 size-5" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-8 text-center text-xs">
        © {new Date().getFullYear()} Xtrava Capital. All rights reserved.
      </footer>
    </div>
  );
}
