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

type TimeUnit = {
  unit: Intl.RelativeTimeFormatUnit;
  ms: number;
};

const TIME_UNITS: TimeUnit[] = [
  { unit: "year", ms: 31536000000 }, // 365 days
  { unit: "month", ms: 2592000000 }, // 30 days
  { unit: "week", ms: 604800000 }, // 7 days
  { unit: "day", ms: 86400000 }, // 24 hours
  { unit: "hour", ms: 3600000 }, // 60 minutes
  { unit: "minute", ms: 60000 }, // 60 seconds
  { unit: "second", ms: 1000 }, // 1000 milliseconds
];

export const formatDateRelative = (date: Date | string) => {
  const targetDate = new Date(date).getTime();
  const now = Date.now();
  const diff = targetDate - now;
  const absDiff = Math.abs(diff);

  // Handle invalid dates
  if (isNaN(targetDate)) {
    throw new Error("Invalid date provided");
  }

  // Initialize formatter
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "long",
  });

  // Handle "just now" case
  if (absDiff < 1000) {
    return "just now";
  }

  // Find the appropriate time unit
  const timeUnit =
    TIME_UNITS.find((unit) => absDiff >= unit.ms) ||
    TIME_UNITS[TIME_UNITS.length - 1];
  const value = Math.round(diff / timeUnit.ms);

  return formatter.format(value, timeUnit.unit);
};

export const timePromise = async <T>(
  promiseFn: () => Promise<T>,
  label?: string
) => {
  const start = Date.now();
  const result = await promiseFn();
  const end = Date.now();
  console.groupCollapsed(`${label ?? "Promise"}`);
  console.log(`${label ?? "Promise"} took ${end - start}ms`);
  console.groupEnd();
  return result;
};

export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, (i + 1) * size)
  );
}
