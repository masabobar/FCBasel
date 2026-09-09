import { act, render, renderHook } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COUNT_UP_DURATION_MS,
  useCountUp,
  useGrow,
  useReducedMotion,
  useUid,
} from "../../app/lib/hooks/use-motion";
import { REDUCED_MOTION_QUERY } from "../../app/lib/motion";
import { duration, durationMs } from "../../app/lib/tokens";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

/**
 * The hooks' own source, comments stripped — a few checks are about what the
 * code may NOT contain (a second `matchMedia`, a hard-coded duration), and the
 * doc comments legitimately mention both.
 */
const HOOKS_CODE = readFileSync(
  resolve(process.cwd(), "app/lib/hooks/use-motion.ts"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

/* ------------------------------------------------------------- HARNESS -- */

/**
 * The frame and preference stubs live in `./support/motion-harness` — every
 * animated component's test file needs the same two, so there is one harness
 * rather than a copy per file.
 */

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ------------------------------------------------------ REDUCED MOTION -- */

describe("useReducedMotion", () => {
  it("reports the preference as it stands at mount", () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it("asks for exactly the query the stylesheet and US-006 use", () => {
    const media = stubMatchMedia(false);

    renderHook(() => useReducedMotion());

    expect(window.matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
    expect(media.listenerCount()).toBe(1);
  });

  it("reacts to the preference being turned on mid-session", () => {
    // The criterion this hook exists for: not just read once at mount. A
    // presenter switching reduce-motion on must be obeyed by charts already up.
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    media.set(true);

    expect(result.current).toBe(true);
  });

  it("reacts to it being turned back off again", () => {
    const media = stubMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());

    media.set(false);

    expect(result.current).toBe(false);
  });

  it("subscribes through the legacy MediaQueryList API where that is all there is", () => {
    const media = stubMatchMedia(false, { legacy: true });
    const { result } = renderHook(() => useReducedMotion());

    expect(media.listenerCount()).toBe(1);

    media.set(true);

    expect(result.current).toBe(true);
  });

  it("detaches its listener on unmount, modern and legacy alike", () => {
    for (const legacy of [false, true]) {
      const media = stubMatchMedia(false, { legacy });
      const { unmount } = renderHook(() => useReducedMotion());

      expect(media.listenerCount()).toBe(1);

      unmount();

      expect(media.listenerCount(), `legacy=${legacy}`).toBe(0);
    }
  });

  it("reports no preference where matchMedia does not exist", () => {
    // The server, and any renderer without a DOM: the stylesheet honours the
    // preference on its own, so a miss must degrade quietly.
    Object.assign(window, { matchMedia: undefined });

    const { result, unmount } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    expect(() => unmount()).not.toThrow();
  });

  it("survives a query list with no listener API at all", () => {
    window.matchMedia = vi.fn(
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    );

    const { result, unmount } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
    expect(() => unmount()).not.toThrow();
  });

  it("is the only reduced-motion read in the hook layer", () => {
    // DRY, and the reason it is testable: one query spelling, in
    // `app/lib/motion.ts`, shared with `app/app.css`.
    expect(HOOKS_CODE).not.toMatch(/matchMedia/);
    expect(HOOKS_CODE).not.toMatch(/prefers-reduced-motion/);
    expect(HOOKS_CODE).toMatch(/reducedMotionQuery/);
  });
});

/* ---------------------------------------------------------------- GROW -- */

describe("useGrow", () => {
  it("is false on the first paint and true once two frames have passed", () => {
    // Two frames, not one: a CSS transition needs the browser to have taken
    // the zero-state style before the grown one lands, or it snaps.
    const frames = stubFrames();
    const { result } = renderHook(() => useGrow());

    expect(result.current).toBe(false);

    frames.advance();
    expect(result.current).toBe(false);

    frames.advance();
    expect(result.current).toBe(true);
  });

  it("is true IMMEDIATELY under reduced motion — nothing is left at zero", () => {
    // The story's second subtle one. Geometry keyed off `grown` renders at
    // final state in the FIRST render, rather than waiting for a transition
    // that will never run: no frame is even requested.
    stubMatchMedia(true);
    const frames = stubFrames();

    const { result } = renderHook(() => useGrow());

    expect(result.current).toBe(true);
    expect(frames.requested()).toBe(0);
  });

  it("still grows where requestAnimationFrame does not exist", () => {
    // Same principle, other cause: no clock is still no excuse for a blank
    // chart, so the growth falls back to a timer rather than never happening.
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.useFakeTimers();

    const { result, unmount } = renderHook(() => useGrow());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe(true);

    unmount();
    vi.useRealTimers();
  });

  it("cancels the fallback timer on unmount too", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.useFakeTimers();

    const { unmount, result } = renderHook(() => useGrow());

    unmount();
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(vi.getTimerCount()).toBe(0);
    expect(result.current).toBe(false);
    vi.useRealTimers();
  });

  it("jumps to grown when the preference is turned on mid-growth", () => {
    const media = stubMatchMedia(false);
    const frames = stubFrames();
    const { result } = renderHook(() => useGrow());

    expect(result.current).toBe(false);

    media.set(true);

    expect(result.current).toBe(true);
    expect(frames.pending()).toBe(0);
  });

  it("cancels its pending frames on unmount", () => {
    const frames = stubFrames();
    const { unmount } = renderHook(() => useGrow());

    expect(frames.pending()).toBe(1);

    unmount();

    expect(frames.pending()).toBe(0);
    expect(frames.cancelled.length).toBeGreaterThan(0);
  });

  it("cancels the second frame too, when unmounted between the two", () => {
    const frames = stubFrames();
    const { unmount, result } = renderHook(() => useGrow());

    frames.advance();
    expect(frames.pending()).toBe(1);

    unmount();

    expect(frames.pending()).toBe(0);
    frames.advance();
    expect(result.current).toBe(false);
  });
});

/* -------------------------------------------------------------- COUNT UP -- */

describe("useCountUp", () => {
  it("takes its ~900ms from the token set rather than a literal", () => {
    expect(duration.countUp).toBe("900ms");
    expect(COUNT_UP_DURATION_MS).toBe(durationMs("countUp"));
    expect(COUNT_UP_DURATION_MS).toBe(900);
    expect(HOOKS_CODE).not.toMatch(/900/);
  });

  it("counts up from zero on mount and lands exactly on the target", () => {
    const frames = stubFrames();
    const { result } = renderHook(() => useCountUp(200));

    expect(result.current).toBe(0);

    frames.advance(0); // the first frame sets the clock's origin
    frames.advance(450);
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(200);

    frames.advance(450);

    // Exactly, not approximately: a tile must never settle on a figure that
    // disagrees with the chart beside it.
    expect(result.current).toBe(200);
    expect(frames.pending()).toBe(0);
  });

  it("eases out — most of the distance is covered early", () => {
    const frames = stubFrames();
    const { result } = renderHook(() => useCountUp(1000));

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 2);

    // Cubic ease-out at the halfway point: 1 - 0.5³ = 87.5% of the distance.
    // A linear ramp would sit at 500 and a bare `ease` far below 875.
    expect(result.current).toBeCloseTo(875, 5);
  });

  it("is still short of the target one millisecond early", () => {
    const frames = stubFrames();
    const { result } = renderHook(() => useCountUp(400));

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS - 1);

    expect(result.current).toBeLessThan(400);

    frames.advance(1);

    expect(result.current).toBe(400);
  });

  it("continues from the CURRENT DISPLAYED VALUE when the target changes mid-flight", () => {
    // THE story. A filter changed while the entrance count-up is still running
    // must carry on from the figure on screen — not snap back to zero and
    // re-count, which is what a naive `0 -> target` does on every interaction.
    const frames = stubFrames();
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target),
      { initialProps: { target: 100 } },
    );

    frames.advance(0);
    frames.advance(90);
    const midFlight = result.current;
    expect(midFlight).toBeGreaterThan(0);
    expect(midFlight).toBeLessThan(100);

    rerender({ target: 500 });

    // Nothing has been shown yet from the new animation, and the number on
    // screen has not moved backwards.
    expect(result.current).toBe(midFlight);

    const observed: number[] = [];
    for (let step = 0; step < 60; step += 1) {
      frames.advance(16);
      observed.push(result.current);
    }

    // The proof, stated exactly: the new animation's opening sample IS the
    // figure that was on screen, and it climbs from there. Never a dip, and
    // above all never a return to zero.
    expect(observed[0]).toBe(midFlight);
    expect(observed[1]).toBeGreaterThan(midFlight);
    expect(Math.min(...observed)).toBe(midFlight);
    expect(result.current).toBe(500);
  });

  it("counts DOWN from the old figure when the new target is smaller", () => {
    // Hero 1's period filter moves numbers both ways; "from the current value"
    // has to mean the same thing in both directions.
    const frames = stubFrames();
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target),
      { initialProps: { target: 1000 } },
    );

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);
    expect(result.current).toBe(1000);

    rerender({ target: 400 });
    frames.advance(0);
    frames.advance(16);

    expect(result.current).toBeLessThan(1000);
    expect(result.current).toBeGreaterThan(400);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(result.current).toBe(400);
  });

  it("only ever runs one animation, so two targets cannot fight", () => {
    const frames = stubFrames();
    const { rerender, result } = renderHook(
      ({ target }: { target: number }) => useCountUp(target),
      { initialProps: { target: 100 } },
    );

    frames.advance(0);
    rerender({ target: 200 });
    rerender({ target: 300 });

    // One pending frame, not three: each retarget cancelled the one before it.
    expect(frames.pending()).toBe(1);

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);

    expect(result.current).toBe(300);
  });

  it("snaps to the target under reduced motion, animating nothing", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    const { result } = renderHook(() => useCountUp(750));

    expect(result.current).toBe(750);
    expect(frames.requested()).toBe(0);
  });

  it("snaps to each new target while the preference is set", () => {
    stubMatchMedia(true);
    const frames = stubFrames();
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target),
      { initialProps: { target: 10 } },
    );

    rerender({ target: 99 });

    expect(result.current).toBe(99);
    expect(frames.requested()).toBe(0);
  });

  it("abandons an animation in flight when the preference is turned on", () => {
    const media = stubMatchMedia(false);
    const frames = stubFrames();
    const { result } = renderHook(() => useCountUp(600));

    frames.advance(0);
    frames.advance(90);
    expect(result.current).toBeLessThan(600);

    media.set(true);

    expect(result.current).toBe(600);
    expect(frames.pending()).toBe(0);
  });

  it("shows the figure outright where there is no clock to animate against", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);

    const { result } = renderHook(() => useCountUp(123));

    expect(result.current).toBe(123);
  });

  it("shows the figure outright when asked for a zero-length count", () => {
    const frames = stubFrames();

    const { result } = renderHook(() => useCountUp(42, 0));

    expect(result.current).toBe(42);
    expect(frames.requested()).toBe(0);
  });

  it("animates over a caller-supplied duration", () => {
    const frames = stubFrames();
    const { result } = renderHook(() => useCountUp(100, 200));

    frames.advance(0);
    frames.advance(200);

    expect(result.current).toBe(100);
  });

  it("requests no frame at all for a figure already on screen", () => {
    const frames = stubFrames();

    renderHook(() => useCountUp(0));

    expect(frames.requested()).toBe(0);
  });

  it("renders a labelled zero rather than animating towards nothing", () => {
    // A zero is a real figure in this product, not a missing one.
    const frames = stubFrames();
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target),
      { initialProps: { target: 500 } },
    );

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);
    rerender({ target: 0 });
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);

    expect(result.current).toBe(0);
  });

  it("does not chase a target that is not a finite number", () => {
    const frames = stubFrames();

    const { result } = renderHook(() => useCountUp(Number.NaN));

    expect(Number.isNaN(result.current)).toBe(true);
    expect(frames.requested()).toBe(0);
  });

  it("cancels its frame on unmount and leaves nothing pending", () => {
    const frames = stubFrames();
    const { unmount } = renderHook(() => useCountUp(300));

    frames.advance(0);
    expect(frames.pending()).toBe(1);

    unmount();

    expect(frames.pending()).toBe(0);
    expect(frames.cancelled.length).toBeGreaterThan(0);
  });

  it("leaks no frame loop when ten charts unmount at once", () => {
    // The demo machine's real case: a hero shows many animated tiles, and
    // Reset unmounts them all mid-count.
    const frames = stubFrames();

    function Tile({ value }: { value: number }) {
      const shown = useCountUp(value);
      const grown = useGrow();
      return <span>{grown ? shown : 0}</span>;
    }

    const { unmount } = render(
      <>
        {Array.from({ length: 10 }, (_unused, index) => (
          <Tile key={index} value={(index + 1) * 100} />
        ))}
      </>,
    );

    frames.advance(0);
    frames.advance(16);
    expect(frames.pending()).toBeGreaterThan(0);

    unmount();

    expect(frames.pending()).toBe(0);
  });
});

/* ------------------------------------------------------------------- UID -- */

describe("useUid", () => {
  it("is stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useUid());
    const first = result.current;

    rerender();
    rerender();

    expect(result.current).toBe(first);
  });

  it("is distinct for every instance on screen", () => {
    function Chart() {
      const uid = useUid("bars");
      return <i data-testid="uid" data-uid={uid} />;
    }

    const { getAllByTestId } = render(
      <>
        <Chart />
        <Chart />
        <Chart />
      </>,
    );

    const ids = getAllByTestId("uid").map((node) => node.dataset.uid);

    expect(new Set(ids).size).toBe(3);
  });

  it("produces an id that is legal in url(#…) and in a selector", () => {
    // React's `useId()` output is not a legal CSS identifier in every version,
    // which is exactly why it is laundered.
    function Chart() {
      const uid = useUid("grad");
      return (
        <svg>
          <defs>
            <linearGradient id={`${uid}-fill`} />
          </defs>
          <rect fill={`url(#${uid}-fill)`} />
        </svg>
      );
    }

    const { container } = render(<Chart />);
    const gradient = container.querySelector("linearGradient");
    const id = gradient?.getAttribute("id") ?? "";

    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(container.querySelector(`#${id}`)).toBe(gradient);
    expect(container.querySelector("rect")?.getAttribute("fill")).toBe(
      `url(#${id})`,
    );
  });

  it("namespaces the id with the caller's prefix", () => {
    const { result } = renderHook(() => useUid("donut"));

    expect(result.current.startsWith("donut-")).toBe(true);
  });

  it("falls back to the house prefix when the caller's sanitises away", () => {
    const { result } = renderHook(() => useUid("«»"));

    expect(result.current.startsWith("fcb-")).toBe(true);
    expect(result.current).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

/* --------------------------------------------------------- SSR / HYDRATION -- */

describe("server rendering", () => {
  function Probe({ target = 250 }: { target?: number }) {
    const reduced = useReducedMotion();
    const grown = useGrow();
    const shown = useCountUp(target);
    const uid = useUid("probe");

    return (
      <p
        data-testid="probe"
        data-reduced={String(reduced)}
        data-grown={String(grown)}
        data-uid={uid}
      >
        {shown}
      </p>
    );
  }

  it("renders with no window, no matchMedia and no animation frames", () => {
    // React Router 7 runs this app on the server. A hook that reached for the
    // DOM during render would take the whole page down, not just its tile.
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.stubGlobal("cancelAnimationFrame", undefined);

    let html = "";
    expect(() => {
      html = renderToString(<Probe />);
    }).not.toThrow();

    // The pre-animation snapshot, which is also what the first client render
    // produces — that agreement is what keeps hydration quiet.
    expect(html).toContain('data-reduced="false"');
    expect(html).toContain('data-grown="false"');
    expect(html).toMatch(/data-uid="probe-[A-Za-z0-9_-]+"/);
    expect(html).toMatch(/>0</);
  });

  it("hydrates without a mismatch", () => {
    stubMatchMedia(false);
    stubFrames();
    const html = renderToString(<Probe />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    act(() => {
      hydrateRoot(container, <Probe />);
    });

    expect(consoleError).not.toHaveBeenCalled();
    container.remove();
  });

  it("hydrates without a mismatch under reduced motion, then shows final state", () => {
    // The server cannot know the preference, so the first client render agrees
    // with it and the truth arrives immediately after — without stranding the
    // number at zero or the geometry ungrown.
    stubMatchMedia(true);
    const frames = stubFrames();
    const html = renderToString(<Probe />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    act(() => {
      hydrateRoot(container, <Probe />);
    });

    expect(consoleError).not.toHaveBeenCalled();

    const probe = container.querySelector("p");
    expect(probe?.dataset.reduced).toBe("true");
    expect(probe?.dataset.grown).toBe("true");
    expect(probe?.textContent).toBe("250");
    // The frames requested while the preference was still unknown were
    // cancelled the moment it became known — nothing is left looping.
    expect(frames.pending()).toBe(0);

    container.remove();
  });
});
