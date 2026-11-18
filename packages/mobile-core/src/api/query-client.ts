import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: (failureCount, error: unknown) => {
          const err = error as { status?: number };
          if (err?.status && err.status >= 400 && err.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        // NON-IDEMPOTENT WRITES: NEVER automatically retry to avoid duplicate operations
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
