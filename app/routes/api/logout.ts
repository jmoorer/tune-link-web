import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { getAppSession } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/logout")({
  GET: async ({ request, params }) => {
    const url = new URL(request.url);

    const session = await getAppSession();
    await session.update({ userId: undefined });
    await session.clear();
    return Response.redirect(url.origin);
  },
});
