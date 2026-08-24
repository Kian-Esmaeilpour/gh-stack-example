import { describe, expect, it } from "vitest";
import { buildOrderStatusView } from "./bff.js";

const order = { id: "A-1", placedAt: "2026-01-01T10:00:00Z", packedAt: "2026-01-01T12:00:00Z" };

describe("buildOrderStatusView", () => {
  it("reports the furthest reached state as current", () => {
    const view = buildOrderStatusView(order, {
      shippedAt: "2026-01-02T09:00:00Z",
      deliveredAt: null,
      estimatedDelivery: "2026-01-04",
    });

    expect(view.currentState).toBe("shipped");
    expect(view.steps.map((s) => s.state)).toEqual(["placed", "packed", "shipped", "delivered"]);
  });

  it("falls back to placed when nothing downstream has happened", () => {
    const view = buildOrderStatusView(
      { id: "A-2", placedAt: "2026-01-01T10:00:00Z", packedAt: null },
      { shippedAt: null, deliveredAt: null, estimatedDelivery: null },
    );

    expect(view.currentState).toBe("placed");
    expect(view.estimatedDelivery).toBeNull();
  });

  it("keeps unreached steps null so the client can render them greyed out", () => {
    const view = buildOrderStatusView(order, {
      shippedAt: null,
      deliveredAt: null,
      estimatedDelivery: null,
    });

    expect(view.steps.find((s) => s.state === "delivered")?.reachedAt).toBeNull();
  });
});
