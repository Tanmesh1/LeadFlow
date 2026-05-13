import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import {
  CalendarClock,
  FileText,
  Loader2,
  MessageSquareText,
  Phone,
  Send,
  StickyNote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDiscussion, useDiscussions } from "@/hooks/use-discussions";
import { useUpdateLead } from "@/hooks/use-leads";
import { cn } from "@/utils/cn";
import { formatDateTime, formatRelativeTime } from "@/utils/date";
import type { Discussion } from "@/types/discussion";
import type { Lead, LeadStatus } from "@/types/lead";

type LeadTimelineDialogProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const statusOptions: Array<{ label: string; value: LeadStatus }> = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal Sent", value: "proposal_sent" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

export function LeadTimelineDialog({
  lead,
  open,
  onOpenChange,
}: LeadTimelineDialogProps) {
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const timelineRef = useRef<HTMLDivElement>(null);

  const discussionsQuery = useDiscussions(open ? lead?.id : undefined);
  const createDiscussion = useCreateDiscussion(lead?.id ?? "");
  const { reset } = createDiscussion;
  const updateLead = useUpdateLead();

  const discussions = useMemo(
    () =>
      [...(discussionsQuery.data ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [discussionsQuery.data],
  );

  const isSavingNote = createDiscussion.isPending;
  const isUpdatingStatus = updateLead.isPending;
  const canSubmit = note.trim().length > 0 && !isSavingNote && Boolean(lead);

  useEffect(() => {
    if (open) {
      timelineRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [discussions.length, open]);

  const resetDraft = () => {
    setNote("");
    setFollowUpDate("");
    setFollowUpTime("");
    reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDraft();
    }

    onOpenChange(nextOpen);
  };

  const handleStatusChange = (nextStatus: LeadStatus) => {
    if (!lead) {
      return;
    }

    updateLead.mutate({ id: lead.id, payload: { status: nextStatus } });
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!lead || !canSubmit) {
      return;
    }

    try {
      await createDiscussion.mutateAsync({
        content: note.trim(),
        followUpAt: buildFollowUpAt(followUpDate, followUpTime),
      });

      setNote("");
      setFollowUpDate("");
      setFollowUpTime("");
      timelineRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Mutation-level error handling keeps the draft in place and shows feedback.
    }
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[100dvh] w-full max-w-none grid-rows-none flex-col overflow-hidden rounded-none p-0 sm:h-[min(760px,calc(100vh-2rem))] sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:rounded-lg">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="truncate text-xl sm:text-2xl">
                {lead?.name ?? "Lead timeline"}
              </DialogTitle>
              <DialogDescription className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>{lead?.company || "Unassigned account"}</span>
                {lead?.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {lead.phone}
                  </span>
                ) : null}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                value={lead?.status ?? "new"}
                onChange={(event) =>
                  handleStatusChange(event.target.value as LeadStatus)
                }
                disabled={!lead || isUpdatingStatus}
                aria-label="Lead status"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {isUpdatingStatus ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div
          ref={timelineRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
        >
          {discussionsQuery.isLoading ? (
            <TimelineSkeleton />
          ) : discussionsQuery.error ? (
            <EmptyState
              title="Unable to load timeline"
              description="Refresh or check that the API server is running."
              icon={MessageSquareText}
            />
          ) : discussions.length ? (
            <Timeline discussions={discussions} />
          ) : (
            <EmptyState
              title="No discussions yet"
              description="Add the first note to start this lead timeline."
              icon={MessageSquareText}
              className="min-h-80"
            />
          )}
        </div>

        <form
          className="border-t bg-background px-4 py-4 sm:px-5"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="grid gap-3">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Add a note, call summary, proposal update..."
              disabled={isSavingNote || !lead}
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="Follow-up date">
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  disabled={isSavingNote || !lead}
                />
              </Field>
              <Field label="Follow-up time">
                <Input
                  type="time"
                  value={followUpTime}
                  onChange={(event) => setFollowUpTime(event.target.value)}
                  disabled={isSavingNote || !lead}
                />
              </Field>
              <Button className="sm:self-end" type="submit" disabled={!canSubmit}>
                {isSavingNote ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {isSavingNote ? "Saving" : "Add note"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Timeline({ discussions }: { discussions: Discussion[] }) {
  return (
    <div className="relative space-y-5 before:absolute before:left-4 before:top-3 before:h-full before:w-px before:bg-border sm:before:left-5">
      {discussions.map((discussion) => (
        <TimelineItem key={discussion.id} discussion={discussion} />
      ))}
    </div>
  );
}

function TimelineItem({ discussion }: { discussion: Discussion }) {
  const { icon: Icon, label, tone } = getDiscussionMeta(discussion);

  return (
    <article className="relative pl-11 sm:pl-14">
      <div
        className={cn(
          "absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border bg-background shadow-sm sm:size-10",
          tone,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {discussion.createdBy ? (
              <span className="text-xs text-muted-foreground">
                by {discussion.createdBy}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(discussion.createdAt)}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
          {discussion.content}
        </p>
        {discussion.followUpAt ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Follow-up {formatDateTime(discussion.followUpAt)}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="w-full rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function getDiscussionMeta(discussion: Discussion): {
  icon: LucideIcon;
  label: string;
  tone: string;
} {
  const content = discussion.content.toLowerCase();

  if (discussion.followUpAt) {
    return {
      icon: CalendarClock,
      label: "Follow-up",
      tone: "text-primary",
    };
  }

  if (content.includes("proposal")) {
    return {
      icon: FileText,
      label: "Proposal",
      tone: "text-amber-600",
    };
  }

  if (content.includes("call") || content.includes("phone")) {
    return {
      icon: Phone,
      label: "Call",
      tone: "text-sky-600",
    };
  }

  return {
    icon: StickyNote,
    label: "Note",
    tone: "text-muted-foreground",
  };
}

function buildFollowUpAt(date: string, time: string) {
  if (!date) {
    return undefined;
  }

  return new Date(`${date}T${time || "09:00"}`).toISOString();
}
