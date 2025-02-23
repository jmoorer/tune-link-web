import { useState } from "react";

export function useToggle(initial?: boolean) {
  const [on, setValue] = useState(initial);
  const toggle = (value?: unknown) => {
    if (typeof value === "boolean") {
      setValue(value);
    } else {
      setValue((v) => !v);
    }
  };
  return [on, toggle] as const;
}
