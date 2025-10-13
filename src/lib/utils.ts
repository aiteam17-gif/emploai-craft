import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Priority = "P1" | "P2" | "P3";

export function calculatePriorityScore(params: {
  urgency: number; // 0..1
  impact: number; // 0..1
  dueSoon: boolean;
  requesterRoleWeight?: number; // 0..1
}) {
  const { urgency, impact, dueSoon, requesterRoleWeight = 0.5 } = params;
  const base = 0.5 * urgency + 0.4 * impact + 0.1 * (dueSoon ? 1 : 0);
  return Math.min(1, Math.max(0, 0.8 * base + 0.2 * requesterRoleWeight));
}
