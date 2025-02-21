import { ValidationError } from "@tanstack/react-form";
import React from "react";
import { cn } from "~/lib/utils";

export const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    errors: string[] | ValidationError[];
  }
>(({ className, children, errors, ...props }, ref) => {
  if (!errors || errors.length === 0) null;
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {Array.isArray(errors) ? errors.join(",") : errors}
    </p>
  );
});
