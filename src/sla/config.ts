export const PRIORITIES = ["low", "normal", "high"] as const;

export type Priority = (typeof PRIORITIES)[number];

// Hours we promise to respond within, per priority.
export const RESPONSE_HOURS: Record<Priority, number> = {
  low: 72,
  normal: 24,
  high: 4,
};
