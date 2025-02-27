import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { deleteCookie, getCookie, setCookie } from "@tanstack/start/server";
import { OAuth2Tokens } from "arctic";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { userProviderTable, usersTable } from "~/db/schema";
import {
  generateCodeVerifier,
  getAppSession,
  RETURN_URL_KEY,
  spotifyAuth,
  spotifyFetcher,
  SpotifyUser,
  STATE_KEY,
  VERIFIER_KEY,
} from "~/lib/auth";
import { ProviderType, ProviderTypeSchema } from "~/lib/validators";
type Profile = {
  id: string;
  provider: ProviderType;
  // userEmail: string | undefined;
  displayName: string;
  avatarUrl: string;
};

export const APIRoute = createAPIFileRoute("/api/auth/$provider/callback")({
  GET: async ({ request, params }) => {
    const parsed = ProviderTypeSchema.safeParse(params.provider);
    if (!parsed.success) {
      throw new Error("Provider no supported");
    }
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const session = await getAppSession();
    const cookieState = getCookie(STATE_KEY);
    const cookieVerifier = getCookie(VERIFIER_KEY);
    // Verify state to prevent CSRF
    if (state !== cookieState || !code || !cookieVerifier) {
      return new Response(null, {
        status: 400,
      });
    }

    const provider = parsed.data;
    let url: URL;
    let tokens: OAuth2Tokens;
    let profile: Profile;

    switch (provider) {
      case "spotify": {
        tokens = await spotifyAuth.validateAuthorizationCode(
          code,
          cookieVerifier
        );
        const sp = await spotifyFetcher<SpotifyUser>("/me", {
          token: tokens.accessToken(),
          method: "GET",
        });
        profile = {
          provider: "spotify",
          id: sp.id,
          avatarUrl: sp.images.at(0)?.url ?? "",
          displayName: sp.display_name,
        };
        break;
      }
      default: {
        throw new Error("Provider no supported");
      }
    }

    const userId = await upsertUserFromProvider(profile, tokens);
    await session.update({
      userId,
    });
    const returnUrl = getCookie(RETURN_URL_KEY) ?? "/";
    deleteCookie(RETURN_URL_KEY);
    deleteCookie(STATE_KEY);
    deleteCookie(VERIFIER_KEY);

    return Response.redirect(returnUrl);
  },
});

async function upsertUserFromProvider(profile: Profile, tokens: OAuth2Tokens) {
  let userId: string;
  const existingConns = await db
    .select({ userId: userProviderTable.userId })
    .from(userProviderTable)
    .where(
      and(
        eq(userProviderTable.providerId, profile.id),
        eq(userProviderTable.provider, profile.provider)
      )
    )
    .limit(1);
  if (existingConns.length > 0) {
    userId = existingConns[0].userId;
    if (tokens) {
      await db
        .update(userProviderTable)
        .set({
          accessToken: tokens.accessToken(),
          refreshToken: tokens.refreshToken(),
          tokenExpiresAt: tokens.accessTokenExpiresAt(),
        })
        .where(
          and(
            eq(userProviderTable.providerId, profile.id),
            eq(userProviderTable.provider, profile.provider)
          )
        );
    }
  } else {
    userId = await db.transaction(async (trx) => {
      const [addedUser] = await trx
        .insert(usersTable)
        .values({
          name: profile.displayName,
          avatar: profile.avatarUrl,
        })
        .returning();
      await trx.insert(userProviderTable).values({
        userId: addedUser.id,
        provider: profile.provider,
        providerId: profile.id,
        accessToken: tokens.accessToken(),
        refreshToken: tokens.refreshToken(),
        tokenExpiresAt: tokens.accessTokenExpiresAt(),
      });
      return addedUser.id;
    });
  }
  return userId;
}
