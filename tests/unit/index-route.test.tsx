import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Index, { meta } from "../../app/routes/_index";

describe("index route", () => {
  it("renders the placeholder shell", () => {
    render(<Index />);

    expect(
      screen.getByRole("heading", { name: "FC Basel Intelligence Platform" }),
    ).toBeInTheDocument();
  });

  it("sets the document title", () => {
    expect(meta()).toEqual([{ title: "FC Basel Intelligence Platform" }]);
  });
});
