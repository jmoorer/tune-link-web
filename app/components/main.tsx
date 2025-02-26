import React from "react";
import { cn } from "~/lib/utils";

interface Props extends React.HTMLAttributes<HTMLElement> {}

const Main = React.forwardRef<HTMLElement, Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1",
          className
        )}
        tabIndex={-1}
        {...props}
      >
        {children}
      </main>
    );
  }
);

Main.displayName = "Main";

export { Main };
