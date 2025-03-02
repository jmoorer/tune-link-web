import { useSession } from "@tanstack/start/server";

type SessionData = {
  userId?: string;
};

export function getAppSession() {
  return useSession<SessionData>({
    password: process.env.SECRET!,
  });
}

export const RETURN_URL_KEY = "returnUrl";
export const STATE_KEY = "state";
export const VERIFIER_KEY = "verifier";
