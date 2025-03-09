import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { deleteCookie, getCookie, setCookie } from "@tanstack/start/server";
import { OAuth2Tokens } from "arctic";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { playlistsTable, userProviderTable, usersTable } from "~/db/schema";
import {
  getAppSession,
  RETURN_URL_KEY,
  STATE_KEY,
  VERIFIER_KEY,
} from "~/lib/auth";
import { getSpotifyUser } from "~/lib/integrations/spotify";
import { spotifyAuth } from "~/lib/integrations/spotify";
import { spotifyFetcher } from "~/lib/integrations/spotify";
import { getYoutubeUser, getYoutubeChannel } from "~/lib/integrations/youtube";
import { youtubeAuth } from "~/lib/integrations/youtube";
import { providerTypeSchema } from "~/lib/validators";
import { ProviderType } from "~/lib/types";
import { nanoid } from "nanoid";
import {
  appleMusicFetcher,
  generateDeveloperToken,
  getTokenExpiration,
  StationResponse,
  getPersonalStation,
} from "~/lib/integrations/apple";
type Profile = {
  id: string;
  provider: ProviderType;
  // userEmail: string | undefined;
  displayName: string;
  avatarUrl: string;
};
const appleLoginSchema = z.object({
  userToken: z.string(),
});
export const APIRoute = createAPIFileRoute("/api/auth/$provider/callback")({
  GET: async ({ request, params }) => {
    const parsed = providerTypeSchema.safeParse(params.provider);
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
        const sp = await getSpotifyUser(tokens.accessToken());
        profile = {
          provider: "spotify",
          id: sp.id,
          avatarUrl: sp.images.at(0)?.url ?? "",
          displayName: sp.display_name,
        };
        break;
      }
      case "youtube": {
        tokens = await youtubeAuth.validateAuthorizationCode(
          code,
          cookieVerifier
        );
        const yt = await getYoutubeUser(tokens.accessToken());
        profile = {
          provider: "youtube",
          id: yt.sub,
          avatarUrl: yt.picture,
          displayName: yt.name,
        };
        break;
      }
      default: {
        throw new Error("Provider no supported");
      }
    }

    const userId = await upsertUserFromProvider(profile, {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
    });
    await session.update({
      userId,
    });
    if (session.id) {
      await transferPlaylistOwnership(userId, session.id);
    }
    const returnUrl = getCookie(RETURN_URL_KEY) ?? "/";
    deleteCookie(RETURN_URL_KEY);
    deleteCookie(STATE_KEY);
    deleteCookie(VERIFIER_KEY);

    return Response.redirect(returnUrl);
  },
  POST: async ({ request, params }) => {
    const parsed = providerTypeSchema.safeParse(params.provider);
    if (!parsed.success) {
      throw new Error("Provider no supported");
    }
    if (parsed.data !== "apple") {
      throw new Error("Provider no supported");
    }
    const formData = await request.formData();

    const body = appleLoginSchema.safeParse(Object.fromEntries(formData));
    if (!body.success) {
      throw new Error("Invalid request");
    }

    const { userToken } = body.data;
    const session = await getAppSession();

    if (!session) {
      throw new Error("Session not found");
    }

    const station = await getPersonalStation(userToken);

    console.log("result", station);
    if (!station) {
      throw new Error("No Apple Music account found");
    }
    function extractUserName(input: string) {
      // Check if the input string contains an apostrophe followed by " Station"
      if (input.includes("'s Station")) {
        // Extract everything before "'s Station"
        return input.split("'s Station")[0];
      } else {
        // Return original input if it doesn't matc"Name not found in expected format";h the expected format
        return "Apple User";
      }
    }
    const userProfile: Profile = {
      provider: "apple",
      id: station.id,
      displayName: extractUserName(station.attributes.name),
      avatarUrl: "",
    };
    const userId = await upsertUserFromProvider(userProfile, {
      accessToken: userToken,
      refreshToken: userToken,
      accessTokenExpiresAt: new Date(getTokenExpiration() * 1000),
    });
    await session.update({
      userId,
    });
    if (session.id) {
      await transferPlaylistOwnership(userId, session.id);
    }
    const returnUrl = getCookie(RETURN_URL_KEY) ?? new URL(request.url).origin;
    deleteCookie(RETURN_URL_KEY);
    deleteCookie(STATE_KEY);
    deleteCookie(VERIFIER_KEY);

    return Response.redirect(returnUrl);
  },
});

const transferPlaylistOwnership = async (userId: string, guestId: string) => {
  await db
    .update(playlistsTable)
    .set({
      userId,
      guestUserId: null,
    })
    .where(eq(playlistsTable.guestUserId, guestId));
};
type Tokens = {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
};
async function upsertUserFromProvider(
  profile: Profile,
  { accessToken, refreshToken, accessTokenExpiresAt }: Tokens
) {
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
    if (accessToken) {
      await db
        .update(userProviderTable)
        .set({
          accessToken,
          refreshToken,
          tokenExpiresAt: accessTokenExpiresAt,
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
        accessToken,
        refreshToken,
        tokenExpiresAt: accessTokenExpiresAt,
      });
      return addedUser.id;
    });
  }
  return userId;
}
