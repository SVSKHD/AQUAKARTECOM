import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "./types";

const feed = {
  area: null,
  days: 30,
  recent: [
    {
      productName: "Kent Automatic 8L | Aquakart",
      productSlug: "kent-automatic-8l",
      productId: "p1",
      quantity: 1,
      area: "Gachibowli",
      purchasedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
  ],
  trending: [
    {
      productName: "Kent Automatic 8L",
      productSlug: "kent-automatic-8l",
      productId: "p1",
      orders: 12,
      units: 14,
      lastPurchasedAt: null,
    },
  ],
};

vi.mock("@/components/demand/useDemandFeed", () => ({
  useDemandFeed: () => ({
    status: "ready",
    result: { feed, nearby: false },
  }),
}));

const { default: DemandStrip, SHOW_HOT_PICKS } = await import("./DemandStrip");

const product = {
  id: "p1",
  title: "Kent Automatic 8L",
  price: 31500,
  photos: [],
} as unknown as Product;

function setup(touch: boolean, onOpenSidebar?: () => void) {
  const onOpen = vi.fn();
  render(
    <DemandStrip
      products={new Map([["p1", product]])}
      area={null}
      onOpen={onOpen}
      bottomOffset={80}
      touch={touch}
      autoTuck={false}
      onOpenSidebar={onOpenSidebar}
    />,
  );
  return { onOpen };
}

describe("DemandStrip (floating demand card)", () => {
  beforeEach(() => {
    window.matchMedia ||= ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    window.localStorage.clear();
    Element.prototype.setPointerCapture = vi.fn();
  });

  it("floats the feed without the site suffix and opens a product", async () => {
    const user = userEvent.setup();
    const { onOpen } = setup(false);
    const card = screen.getByRole("complementary", {
      name: "Recent purchases on Aquakart",
    });
    expect(card).toHaveTextContent(
      "Kent Automatic 8L · bought in Gachibowli · 3 hours ago",
    );
    expect(card).not.toHaveTextContent("| Aquakart");
    expect(card).toHaveTextContent("Bought 12 times in the last 30 days");
    expect(card).toHaveTextContent("₹31,500");
    await user.click(screen.getByRole("button", { name: /12 times/ }));
    expect(onOpen).toHaveBeenCalledWith("p1");
  });

  it("tucks into the edge tab and comes back, remembering the choice", async () => {
    const user = userEvent.setup();
    setup(false);
    await user.click(
      screen.getByRole("button", { name: "Tuck recent purchases away" }),
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("aqua.demand.tucked")).toBe("1");
    await user.click(screen.getByRole("button", { name: /^Show / }));
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(window.localStorage.getItem("aqua.demand.tucked")).toBe("0");
  });

  it("on touch, the bubble swaps flame and clock but always opens the sidebar", () => {
    vi.useFakeTimers();
    try {
      window.localStorage.setItem("aqua.demand.tucked", "1");
      const onOpenSidebar = vi.fn();
      setup(true, onOpenSidebar);
      const bubble = screen.getByRole("button", { name: /^Open the sidebar/ });
      expect(bubble).toHaveAttribute("data-face", "hot");
      fireEvent.click(bubble);
      act(() => vi.advanceTimersByTime(2800));
      expect(bubble).toHaveAttribute("data-face", "sidebar");
      fireEvent.click(bubble);
      expect(onOpenSidebar).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
      // The sidebar's "Hot picks" row brings the card back.
      act(() => {
        window.dispatchEvent(new Event(SHOW_HOT_PICKS));
      });
      expect(screen.getByRole("complementary")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the flame alone without a sidebar to open", () => {
    window.localStorage.setItem("aqua.demand.tucked", "1");
    setup(true);
    expect(screen.getByRole("button", { name: /^Show / })).not.toHaveAttribute(
      "data-face",
    );
  });

  it("swipes away on touch screens, and a short drag doesn't", () => {
    setup(true);
    const card = screen.getByRole("complementary");
    const swipe = (to: number) => {
      fireEvent.pointerDown(card, { pointerId: 1, clientX: 200, clientY: 300 });
      fireEvent.pointerMove(card, { pointerId: 1, clientX: to, clientY: 302 });
      fireEvent.pointerUp(card, { pointerId: 1, clientX: to, clientY: 302 });
    };
    swipe(180);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    swipe(40);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Show / })).toBeInTheDocument();
  });

  it("drags the Popular bubble like AssistiveTouch: snaps to an edge and opens there", () => {
    // jsdom has no layout: give the workspace a size.
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 400 });
    Object.defineProperty(host, "clientHeight", { value: 800 });
    const parent = vi
      .spyOn(HTMLElement.prototype, "offsetParent", "get")
      .mockReturnValue(host);
    window.localStorage.setItem("aqua.demand.tucked", "1");
    setup(true);
    const bubble = screen.getByRole("button", { name: /^Show / });
    expect(bubble).toHaveAttribute("data-side", "left");

    fireEvent.pointerDown(bubble, { pointerId: 2, clientX: 10, clientY: 600 });
    fireEvent.pointerMove(bubble, { pointerId: 2, clientX: 330, clientY: 300 });
    expect(bubble).toHaveAttribute("data-dragging", "true");
    fireEvent.pointerUp(bubble, { pointerId: 2, clientX: 330, clientY: 300 });
    // The click that ends the drag doesn't open the card.
    fireEvent.click(bubble);
    expect(bubble).toHaveAttribute("data-side", "right");
    expect(bubble).toHaveAttribute("data-dragging", "false");
    expect(
      JSON.parse(window.localStorage.getItem("aqua.demand.tab") || "{}"),
    ).toMatchObject({ side: "right" });
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

    // A tap opens the card on the right, and it swipes right to tuck away.
    fireEvent.click(bubble);
    const card = screen.getByRole("complementary");
    expect(card.style.right).toBe("16px");
    expect(card).toHaveTextContent("Swipe right to tuck away");
    fireEvent.pointerDown(card, { pointerId: 3, clientX: 100, clientY: 300 });
    fireEvent.pointerMove(card, { pointerId: 3, clientX: 260, clientY: 302 });
    fireEvent.pointerUp(card, { pointerId: 3, clientX: 260, clientY: 302 });
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    parent.mockRestore();
  });
});
