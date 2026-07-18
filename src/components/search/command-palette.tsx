"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, FileStack, Loader2, Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface SearchResults {
  lenders: { id: string; title: string; subtitle: string }[];
  loanRequests: { id: string; title: string; subtitle: string }[];
  interpretation?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResults | null>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (e.key === "/" && (e.target as HTMLElement)?.tagName === "INPUT") return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const debouncedQuery = useDebouncedValue(query, 250);

  React.useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok && !cancelled) setResults(await res.json());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground w-full max-w-sm justify-start gap-2 sm:pr-12"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search lenders, borrowers, matches…</span>
        <span className="sm:hidden">Search…</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] sm:flex">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search the platform">
        <CommandInput
          placeholder='Try "Bridge lenders in NJ" or "DSCR lenders over $2M"'
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && query.trim().length >= 2 && <CommandEmpty>No results found.</CommandEmpty>}
          {results?.interpretation && (
            <div className="text-muted-foreground border-b px-4 py-2 text-xs">
              Interpreted as: <span className="text-foreground font-medium">{results.interpretation}</span>
            </div>
          )}
          {results && results.lenders.length > 0 && (
            <CommandGroup heading="Lenders">
              {results.lenders.map((lender) => (
                <CommandItem
                  key={lender.id}
                  value={lender.id}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/lenders/${lender.id}`);
                  }}
                >
                  <Building2 />
                  <div className="flex flex-col">
                    <span>{lender.title}</span>
                    <span className="text-muted-foreground text-xs">{lender.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.loanRequests.length > 0 && (
            <CommandGroup heading="Loan requests">
              {results.loanRequests.map((lr) => (
                <CommandItem
                  key={lr.id}
                  value={lr.id}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/loan-requests/${lr.id}`);
                  }}
                >
                  <FileStack />
                  <div className="flex flex-col">
                    <span>{lr.title}</span>
                    <span className="text-muted-foreground text-xs">{lr.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
