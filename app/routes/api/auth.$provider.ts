import { json } from "@tanstack/start";
import { setCookie } from "@tanstack/start/server";
import { createAPIFileRoute } from "@tanstack/start/api";
import {
  generateCodeVerifier,
  generateState,
  getAppSession,
  RETURN_URL_KEY,
  STATE_KEY,
  VERIFIER_KEY,
  spotifyAuth,
} from "~/lib/auth";
import { ProviderTypeSchema } from "~/lib/validators";

export const APIRoute = createAPIFileRoute("/api/auth/$provider")({
  GET: async ({ request, params }) => {
    const parsed = ProviderTypeSchema.safeParse(params.provider);
    if (!parsed.success) {
      throw new Error("Provider not supported");
    }
    const provider = parsed.data;
    const state = generateState();
    const verifier = generateCodeVerifier();
    let url: URL;

    switch (provider) {
      case "spotify": {
        url = spotifyAuth.createAuthorizationURL(state, verifier, [
          "playlist-modify-public",
          "playlist-modify-private",
          "user-read-private",
          "user-read-email",
        ]);
        break;
      }
      default: {
        throw new Error("Provider not supported");
      }
    }

    setCookie(STATE_KEY, state);
    setCookie(VERIFIER_KEY, verifier);
    setCookie(RETURN_URL_KEY, request.headers.get("referer") ?? "/");
    return Response.redirect(url);
  },
});
