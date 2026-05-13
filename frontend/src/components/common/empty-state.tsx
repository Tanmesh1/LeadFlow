import type { LucideIcon } from "lucide-react";
import { Inbox, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-12 text-center shadow-sm",
        className,
      )}
    >
      <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
        <Sparkles
          className="absolute -right-1 -top-1 size-3.5 text-primary/70"
          aria-hidden="true"
        />
      </div>
      <h2 className="mt-4 text-base font-semibold text-balance">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-balance text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
