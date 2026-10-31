import { describe, expect, it } from "vitest";
import {
  FLOW,
  canDispatch,
  flowReducer,
  initialFlow,
  isPaymentLocked,
  panelOpen,
  type Flow,
  type FlowAction,
} from "./aquaFlow";

const run = (...actions: FlowAction[]) =>
  actions.reduce(flowReducer, initialFlow);

describe("aquaFlow", () => {
  it("walks the happy path from welcome to confirmed", () => {
    const f = run(
      { type: "SEND" },
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "PAY" },
      { type: "VERIFIED" },
    );
    expect(f).toEqual({ state: "confirmed", parked: null, productId: "p1" });
  });

  it("ignores every action not listed for the current state", () => {
    const states = Object.keys(FLOW) as (keyof typeof FLOW)[];
    const all = new Set(states.flatMap((s) => Object.keys(FLOW[s]))) as Set<
      FlowAction["type"]
    >;
    for (const state of states) {
      const f: Flow = { state, parked: null, productId: "p1" };
      for (const type of all) {
        if (FLOW[state][type]) continue;
        expect(flowReducer(f, { type })).toBe(f);
        expect(canDispatch(f, type)).toBe(false);
      }
    }
  });

  it("locks the panel while a payment is pending", () => {
    const f = run(
      { type: "SEND" },
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "PAY" },
    );
    expect(isPaymentLocked(f)).toBe(true);
    for (const type of ["RESET", "CLOSE", "VIEW", "BACK", "EDIT"] as const) {
      expect(flowReducer(f, { type })).toBe(f);
    }
  });

  it("parks checkout on close and resumes it with the product", () => {
    const parked = run(
      { type: "SEND" },
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "CLOSE" },
    );
    expect(parked).toEqual({
      state: "chatting",
      parked: "checkout",
      productId: "p1",
    });
    expect(panelOpen(parked)).toBe(false);
    expect(flowReducer(parked, { type: "RESUME" })).toEqual({
      state: "checkout",
      parked: null,
      productId: "p1",
    });
  });

  it("parks a failed payment too", () => {
    const f = run(
      { type: "SEND" },
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "PAY" },
      { type: "FAILED" },
      { type: "CLOSE" },
    );
    expect(f.parked).toBe("payment_failed");
    expect(flowReducer(f, { type: "RESUME" }).state).toBe("payment_failed");
  });

  it("rejects RESUME when nothing is parked", () => {
    const f = run({ type: "SEND" });
    expect(flowReducer(f, { type: "RESUME" })).toBe(f);
    expect(canDispatch(f, "RESUME")).toBe(false);
  });

  it("swaps the product in place on VIEW", () => {
    const f = run(
      { type: "VIEW", productId: "p1" },
      { type: "VIEW", productId: "p2" },
    );
    expect(f).toEqual({ state: "product", parked: null, productId: "p2" });
  });

  it("drops the parked step when another product is opened", () => {
    const f = run(
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "CLOSE" },
      { type: "VIEW", productId: "p2" },
    );
    expect(f).toEqual({ state: "product", parked: null, productId: "p2" });
  });

  it("RESET goes back to welcome and clears the product", () => {
    expect(run({ type: "VIEW", productId: "p1" }, { type: "RESET" })).toEqual(
      initialFlow,
    );
  });

  it("opens the comparison and goes to a product or straight to checkout", () => {
    const compared = run({ type: "SEND" }, { type: "COMPARE" });
    expect(compared).toEqual({
      state: "compare",
      parked: null,
      productId: null,
    });
    expect(panelOpen(compared)).toBe(true);
    const viewed = flowReducer(compared, { type: "VIEW", productId: "p2" });
    expect(viewed).toEqual({ state: "product", parked: null, productId: "p2" });
    expect(flowReducer(viewed, { type: "BACK" }).state).toBe("compare");
    expect(flowReducer(compared, { type: "BUY", productId: "p3" })).toEqual({
      state: "checkout",
      parked: null,
      productId: "p3",
    });
  });

  it("opens the shop artifact from anywhere but a payment in progress", () => {
    const shop = run({ type: "VIEW", productId: "p1" }, { type: "SHOP" });
    expect(shop).toEqual({ state: "shop", parked: null, productId: null });
    expect(panelOpen(shop)).toBe(true);
    const viewed = flowReducer(shop, { type: "VIEW", productId: "p2" });
    // A product opened from the shop goes back to it.
    expect(flowReducer(viewed, { type: "SHOP" }).state).toBe("shop");
    expect(flowReducer(shop, { type: "BUY", productId: "p3" })).toMatchObject({
      state: "checkout",
      productId: "p3",
    });
    expect(flowReducer(shop, { type: "CLOSE" }).state).toBe("chatting");
    const paying = run(
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "PAY" },
    );
    expect(canDispatch(paying, "SHOP")).toBe(false);
  });

  it("lets a late paid confirm a payment that timed out or failed", () => {
    const failed = run(
      { type: "VIEW", productId: "p1" },
      { type: "BUY" },
      { type: "PAY" },
      { type: "FAILED" },
    );
    expect(flowReducer(failed, { type: "VERIFIED" }).state).toBe("confirmed");
  });
});
