import { describe, expect, it } from "vitest";
import {
  Button,
  Card,
  Combobox,
  EmptyState,
  ErrorState,
  Input,
  PageShell,
  Section,
} from "./index";

const expectComponentExport = (component) => {
  expect(component).toBeTruthy();
  expect(["function", "object"]).toContain(typeof component);
};

describe("ui barrel exports", () => {
  it("exports all reusable UI components", () => {
    expectComponentExport(Button);
    expectComponentExport(Input);
    expectComponentExport(Card);
    expectComponentExport(Section);
    expectComponentExport(PageShell);
    expectComponentExport(EmptyState);
    expectComponentExport(ErrorState);
    expectComponentExport(Combobox);
  });
});
