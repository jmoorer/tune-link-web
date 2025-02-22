import React from "react";
import { cn } from "~/lib/utils";

interface Props extends React.HTMLAttributes<HTMLElement> {
  scrollable?: boolean;
}

const Main = React.forwardRef<HTMLElement, Props>(
  ({ className, children, scrollable = false, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1",
          {
            "overflow-auto": scrollable,
            "overflow-hidden": !scrollable,
          },
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
