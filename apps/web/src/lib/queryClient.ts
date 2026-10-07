import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,        // 1 minute — data is fresh for 1 min
      retry: 1,                    // retry failed requests once
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});