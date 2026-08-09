import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { Persister } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { storage } from './storage';

const QUERY_CACHE_KEY = 'mindvault_query_cache';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_MAX_AGE,
      networkMode: 'offlineFirst',
      refetchOnMount: 'always',
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

const mmkvPersister: Persister = {
  persistClient: async (client) => {
    storage.setString(QUERY_CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    const cached = storage.getString(QUERY_CACHE_KEY);
    return cached ? JSON.parse(cached) : undefined;
  },
  removeClient: async () => {
    storage.remove(QUERY_CACHE_KEY);
  },
};

export function clearPersistedQueryCache() {
  queryClient.clear();
  storage.remove(QUERY_CACHE_KEY);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: mmkvPersister, maxAge: CACHE_MAX_AGE }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
