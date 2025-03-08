import { queryOptions } from "@tanstack/react-query";
import { getAppleToken } from "~/api/config";

export const appleMusicTokenQuery = queryOptions({
  queryKey: ["appleMusicToken"],
  queryFn: async () => await getAppleToken(),
});
