import { ValidatorAdapter } from "@tanstack/react-router";
import z, { SafeParseReturnType } from "zod";
import { createMiddleware } from "@tanstack/start";
import { getAppSession } from "~/lib/auth";
import { HTTPError } from "~/lib/fetch";

export const safeValidate = <T extends z.ZodTypeAny>(
  schema: T
): ValidatorAdapter<T["_input"], T["_output"]> => {
  return {
    types: { input: schema._input, output: schema._output },
    parse: (input: unknown) => {
      const {
        success,
        error,
        data,
      }: SafeParseReturnType<T["_input"], T["_output"]> =
        schema.safeParse(input);
      if (!success) {
        throw error.flatten();
      }
      return data;
    },
  };
};

export const sessionMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await getAppSession();
  const owner = session.data.userId
    ? {
        type: "user" as const,
        userId: session.data.userId,
      }
    : {
        type: "guest" as const,
        guestId: session.id ?? "",
      };
  return next({
    context: {
      owner,
    },
  });
});

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await getAppSession();
  if (!session.data.userId) {
    throw new HTTPError("Unauthorized", 401);
  }
  return next({
    context: {
      userId: session.data.userId,
    },
  });
});
