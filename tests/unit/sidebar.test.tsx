import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import {
  ACTIVE_NAV_ITEM,
  INERT_NAV_ITEMS,
  Sidebar,
} from "../../app/components/chrome/sidebar";

const SIDEBAR_SOURCE = readFileSync(
  resolve(__dirname, "../../app/components/chrome/sidebar.tsx"),
  "utf8",
);

/** Everything the browser would let a keyboard or a click reach. */
const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex], [role="button"], [role="link"]';

function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="pathname">{pathname}</span>;
}

/** Sidebar mounted with a second route, so a real navigation would show up. */
function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Sidebar />
      <LocationProbe />
      <Routes>
        <Route path="/" element={null} />
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  );
}

function sidebar(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
}

function inertItems(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="nav-inert"]'),
  );
}

describe("Sidebar — structure", () => {
  it("is a navy landmark labelled as the workspace navigation", () => {
    renderSidebar();

    expect(sidebar()).toHaveClass("bg-navy");
    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeTruthy();
  });

  it("hides below the large breakpoint and shows from lg upwards", () => {
    renderSidebar();

    // AC 4: a narrow viewport gives the canvas the full width instead of
    // scrolling the shell sideways.
    expect(sidebar()).toHaveClass("hidden", "lg:flex");
  });

  it("does not grow or shrink with the canvas beside it", () => {
    renderSidebar();

    expect(sidebar()).toHaveClass("shrink-0", "w-60");
  });

  it("lists the active item first, then the three placeholders", () => {
    renderSidebar();

    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      ACTIVE_NAV_ITEM.label,
      ...INERT_NAV_ITEMS.map((item) => item.label),
    ]);
  });
});

describe("Sidebar — the active item", () => {
  it("marks Dashboard as the current page", () => {
    renderSidebar();

    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboard).toHaveAttribute("aria-current", "page");
  });

  it("points Dashboard at the single route", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("is the only link in the sidebar", () => {
    renderSidebar();

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("Sidebar — the placeholder items are inert", () => {
  it("renders all three placeholders", () => {
    renderSidebar();

    expect(inertItems()).toHaveLength(INERT_NAV_ITEMS.length);
    for (const { label } of INERT_NAV_ITEMS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders them as plain spans — never a link or a button", () => {
    renderSidebar();

    for (const item of inertItems()) {
      expect(item.tagName).toBe("SPAN");
      expect(item).not.toHaveAttribute("href");
      expect(item).not.toHaveAttribute("role");
    }
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("announces them as disabled rather than as something to activate", () => {
    renderSidebar();

    for (const item of inertItems()) {
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("keeps them out of the tab order entirely", async () => {
    renderSidebar();
    const user = userEvent.setup();

    // Walk further than there are rows, so a placeholder cannot hide behind
    // the end of the sweep.
    for (let step = 0; step < INERT_NAV_ITEMS.length + 3; step += 1) {
      await user.tab();
      expect(inertItems()).not.toContain(document.activeElement);
    }
  });

  it("exposes nothing focusable besides the Dashboard link", () => {
    renderSidebar();

    const focusable = Array.from(
      sidebar().querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    expect(focusable).toEqual([
      screen.getByRole("link", { name: "Dashboard" }),
    ]);
  });

  it("does nothing at all when one is clicked", () => {
    renderSidebar();
    const before = screen.getByTestId("pathname").textContent;

    for (const item of inertItems()) {
      // `fireEvent` rather than `userEvent`: user-event refuses to click an
      // element with `pointer-events: none`, which is itself the affordance
      // being removed. Dispatching the event directly proves the harder
      // point — even a synthesised click changes nothing.
      fireEvent.click(item);
    }

    expect(screen.getByTestId("pathname").textContent).toBe(before);
    expect(before).toBe("/");
  });

  it("removes the hover affordance along with the click", () => {
    renderSidebar();

    for (const item of inertItems()) {
      expect(item).toHaveClass("pointer-events-none", "cursor-default");
    }
  });

  it("dims them so they read as placeholders", () => {
    renderSidebar();

    for (const item of inertItems()) {
      expect(item).toHaveClass("opacity-50", "text-slate");
    }
  });

  it("declares no hover state and no route for a placeholder in source", () => {
    // A guard against the item quietly becoming real later: the file must
    // contain no `hover:` styling and no second route target.
    expect(SIDEBAR_SOURCE).not.toMatch(/hover:/);
    expect(SIDEBAR_SOURCE.match(/to="/g)).toHaveLength(1);
  });
});

describe("Sidebar — token discipline", () => {
  it("uses no literal colour value", () => {
    expect(SIDEBAR_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SIDEBAR_SOURCE).not.toMatch(/\brgba?\(/);
  });

  it("never injects raw HTML", () => {
    expect(SIDEBAR_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
