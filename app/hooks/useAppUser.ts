import { getRouteApi } from "@tanstack/react-router";

export function useAppUser() {
  const routeApi = getRouteApi("__root__");
  const user = routeApi.useLoaderData();
  return user;
}
