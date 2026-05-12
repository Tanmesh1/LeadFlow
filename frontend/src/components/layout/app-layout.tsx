import type { ReactNode } from "react";
import { BarChart3, Plus, Search } from "lucide-react";
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
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-4 md:py-0 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5">LeadFlow</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Pipeline workspace
              </p>
            </div>
          </div>

          <div className="w-full md:ml-auto md:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search leads, companies, sources"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
          </div>

          <Button className="w-full md:w-auto" onClick={onAddLead}>
            <Plus className="size-4" aria-hidden="true" />
            Add lead
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
