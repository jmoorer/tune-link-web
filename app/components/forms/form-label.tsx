import React, { PropsWithChildren } from "react";
import { Label } from "../ui/label";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const labelVariants = cva("gap-1.5", {
  variants: {
    inline: {
      false: "grid",
      true: "flex flex-row items-center",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    inline: false,
    fullWidth: true,
  },
});

interface Props extends VariantProps<typeof labelVariants> {
  label: string;
  className?: string | undefined;
}
const FormLabel = ({
  label,
  children,
  inline,
  className,
}: PropsWithChildren<Props>) => {
  return (
    <div className={cn(labelVariants({ inline, className }))}>
      <Label>{label}</Label>
      {children}
    </div>
  );
};
const RadioLabel = ({
  label,
  children,
  className,
}: PropsWithChildren<Props>) => {
  return (
    <div className={cn(labelVariants({ inline: true, className }))}>
      {children}
      <Label>{label}</Label>
    </div>
  );
};

export { RadioLabel, FormLabel };
