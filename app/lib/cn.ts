import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins conditional class names and resolves Tailwind conflicts, so a shared
 * component can carry its own base classes while still letting a caller
 * override one of them through `className` (`h-full`, a grid span, and so on).
 *
 * Custom token utilities (`p-tile`, `rounded-tile`) are outside
 * `tailwind-merge`'s built-in conflict groups; it passes them through
 * untouched, which is the safe direction — nothing is silently dropped.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
