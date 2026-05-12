export type ApiErrorResponse = {
  detail?: string | Array<{ msg: string; loc?: Array<string | number> }>;
};
