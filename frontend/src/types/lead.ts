export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "won"
  | "lost";

export type Lead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  notes?: string | null;
  status: LeadStatus;
  lastDiscussion?: string | null;
  lastDiscussionAt?: string | null;
  nextFollowUp?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeadCreateInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  notes?: string | null;
  status?: LeadStatus;
};

export type LeadUpdateInput = Partial<LeadCreateInput>;

export type LeadFilters = {
  status?: LeadStatus;
  search?: string;
  overdue?: boolean;
  today?: boolean;
};
