export type Discussion = {
  id: string;
  leadId: string;
  content: string;
  createdBy?: string | null;
  followUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiscussionCreateInput = {
  content: string;
  createdBy?: string | null;
  followUpAt?: string | null;
};
