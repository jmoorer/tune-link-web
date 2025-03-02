import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  notifyManager,
} from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { toast } from "sonner";

export function createRouter() {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnReconnect: () => !queryClient.isMutating(),
      },
    },
    queryCache: new QueryCache({
      onError: (error, query: any) => {
        if (query.meta.errorMessage) {
          toast.error(query.meta.errorMessage);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _, __, mutation) => {
        if (mutation?.meta?.errorMessage) {
          toast.error(mutation.meta.errorMessage as string);
        }
      },
    }),
  });
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      scrollRestoration: true,
      context: { queryClient },
    }),
    queryClient
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
