import { AnyFieldApi, ValidationError } from "@tanstack/react-form";
import React from "react";
import { cn } from "~/lib/utils";

export function FieldError({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em className="text-sm font-medium text-destructive">
          {field.state.meta.errors.map((err) => err.message).join(",")}
        </em>
      ) : null}
    </>
  );
}
