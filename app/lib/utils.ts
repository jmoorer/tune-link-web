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

export function formatMediaDuration(
  seconds: number,
  format: "standard" | "extended" | "full" = "standard"
): string {
  if (seconds < 0) {
    throw new Error("Duration must be a positive number");
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  switch (format) {
    case "standard":
      // Format: 3:45 or 1:23:45 (if hours > 0)
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
      } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
      }

    case "extended":
      // Format: 3m 45s or 1h 23m 45s (if hours > 0)
      if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }

    case "full":
      // Format: 3 minutes 45 seconds or 1 hour 23 minutes 45 seconds
      const parts: string[] = [];

      if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
      }

      if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
      }

      if (remainingSeconds > 0 || parts.length === 0) {
        parts.push(
          `${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`
        );
      }

      return parts.join(" ");

    default:
      throw new Error("Invalid format specified");
  }
}
