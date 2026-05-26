import { describe, expect, it } from "vitest";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageShell,
  Section,
} from "./index";

describe("ui barrel exports", () => {
  it("exports all reusable UI components", () => {
    expect(Button).toBeTypeOf("function");
    expect(Input).toBeTypeOf("function");
    expect(Card).toBeTypeOf("function");
    expect(Section).toBeTypeOf("function");
    expect(PageShell).toBeTypeOf("function");
    expect(EmptyState).toBeTypeOf("function");
    expect(ErrorState).toBeTypeOf("function");
  });
});
