import type { OrderStatusView } from "../../orders/contract.js";

// Framework-free render function so the demo stays dependency-light.
// In a real app this would be a React/Vue component consuming the same contract.
export function renderOrderStatusTracker(view: OrderStatusView): string {
  const steps = view.steps
    .map((step) => {
      const reached = step.reachedAt !== null;
      const marker = reached ? "●" : "○";
      const label = step.state.toUpperCase();
      const when = reached ? new Date(step.reachedAt!).toLocaleDateString() : "pending";
      return `  ${marker} ${label} — ${when}`;
    })
    .join("\n");

  const eta = view.estimatedDelivery
    ? `Estimated delivery: ${view.estimatedDelivery}`
    : "Estimated delivery: not available yet";

  return [`Order ${view.orderId} — ${view.currentState}`, steps, eta].join("\n");
}
