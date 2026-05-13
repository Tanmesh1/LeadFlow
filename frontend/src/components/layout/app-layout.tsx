import type { ReactNode } from "react";
import { Plus, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AppLayoutProps = {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddLead?: () => void;
};

export function AppLayout({
  children,
  searchValue = "",
  onSearchChange,
  onAddLead,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex min-h-16 max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-4 md:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <TrendingUp className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="truncate text-xl font-bold leading-6 text-primary">
              LeadFlow
            </p>
          </div>

          <div className="w-full md:ml-auto md:max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 bg-background/80 pl-9"
                placeholder="Search leads, companies, sources"
                value={searchValue}
                aria-label="Search leads"
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
          </div>

          <Button className="w-full md:w-auto" onClick={onAddLead}>
            <Plus className="size-4" aria-hidden="true" />
            Add New Lead
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
