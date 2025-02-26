import { getCurrentUser } from "~/api/auth";

export type AppUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
