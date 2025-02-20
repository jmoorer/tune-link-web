import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function indexBy<T, K extends PropertyKey>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      acc[key] = item;
      return acc;
    },
    {} as Record<K, T>
  );
}
