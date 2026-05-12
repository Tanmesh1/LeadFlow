import { QueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError(error) {
        console.error(getApiErrorMessage(error));
      },
    },
  },
});
