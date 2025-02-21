import { ValidatorAdapter } from "@tanstack/react-router";
import z, { SafeParseReturnType } from "zod";

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
