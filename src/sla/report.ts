import { PRIORITIES, type Priority } from "./config.js";
import { isBreached } from "./policy.js";

export interface Incident {
  id: string;
  priority: Priority;
  openedAt: Date;
}

export function breachReport(incidents: Incident[], now: Date) {
  const counts = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Record<Priority, number>;

  for (const incident of incidents) {
    if (isBreached(incident.priority, incident.openedAt, now)) {
      counts[incident.priority]++;
    }
  }

  return { generatedAt: now.toISOString(), breaches: counts };
}
