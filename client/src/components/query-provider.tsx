import type { ReactNode } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  queryClient,
  PERSIST_MAX_AGE_MS,
  PERSIST_BUSTER,
  PERSIST_QUERY_KEY,
  shouldPersistQuery,
} from "@/lib/queryClient";

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: PERSIST_QUERY_KEY,
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            shouldPersistQuery(query.queryKey),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
