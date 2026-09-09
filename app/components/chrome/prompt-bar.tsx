import { Search, Send } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "../../lib/cn";

/**
 * The persistent prompt bar — the one place a question enters this product, and
 * the only user input in the whole prototype.
 *
 * It is pinned to the foot of the screen and is always visible, because the
 * dashboard grows downwards: a bar that scrolled away with the canvas would
 * leave the presenter with no way to ask the next question without scrolling
 * back (US-028 criterion: "always visible").
 *
 * ONE FIELD, AND THE FIELD ITSELF IS THE TYPING AREA.
 * The search icon and the send button live INSIDE the rounded field, as
 * siblings of the `<input>`. There is deliberately no inner bordered box: only
 * the field carries a border, and a nested box was reported as a defect in
 * review. `PROMPT_FIELD_CLASS` below is the only border in this component, the
 * focus ring is `:focus-within` on that same element, and the input's own
 * outline is suppressed so focus reads as ONE ring around ONE field rather than
 * a box inside a box. A test walks the field's subtree and fails on any
 * descendant that carries a border or ring class, so the structure is enforced
 * and not merely intended.
 *
 * WHAT THIS FILE DOES NOT DO — five things, all of them the next stories:
 *
 *   US-029  Suggestion chips. They render through {@link PromptBarProps.children},
 *           in the row above the field, and they import
 *           `CHIP_SURFACE_CLASS` from `app/components/controls/segmented.tsx`
 *           (left there for exactly that purpose). Nothing in here styles them.
 *   US-030  Intent matching. THE SUBMIT SEAM IS {@link PromptBarProps.onSubmit}:
 *           it receives the trimmed question string and nothing else. Wiring it
 *           to the matcher is US-030's job; this component never decides what a
 *           question means.
 *   US-031  The thinking beat. It passes {@link PromptBarProps.busy} while a
 *           render is in flight (see the debounce note below) and schedules the
 *           delay through `useDashboard`'s `schedule`, which is the ONE pending
 *           timer in the app. There is no timer in this file, by design.
 *   US-032  The fallback panel. An unmatched question is not this component's
 *           problem: it submits, and the panel is rendered on the canvas.
 *   US-033  Follow-up gating, which happens entirely behind `onSubmit`.
 *
 * DEBOUNCE IS A REAL CRITERION, AND IT IS NOT A TIMER.
 * "Rapid repeated submits produce one render" is satisfied two ways at once,
 * neither of which adds a second clock to a system that already has exactly
 * one (`useDashboard`'s `schedule`):
 *
 *   1. A SUBMIT CONSUMES THE QUESTION. The field clears as part of submitting,
 *      and the cleared value is written to {@link draft} — a ref — BEFORE
 *      `onSubmit` is called. So a second submit fired in the same tick (a
 *      double-click, a held Enter, a click landing on the same event loop turn
 *      as an implicit submission) reads an empty draft and is a no-op by
 *      criterion 3, rather than reading a stale React value and firing twice.
 *      This is the same committed-ref trick `useDashboard` uses to make two
 *      presses in one frame see each other.
 *   2. `busy` CLOSES THE FIELD. While a beat is in flight the input and the
 *      send button are genuinely `disabled`, so no fourth press can queue an
 *      overlapping render.
 *
 * SECURITY — the one user input in the product (`.claude/rules/security-review.md`).
 * The typed value is state and an argument, never markup and never a locator:
 * it is rendered only as the `value` of an `<input>`, there is no
 * `dangerouslySetInnerHTML` or `innerHTML` anywhere in this file, it builds no
 * URL, no query and no selector (the one selector here is the fixed
 * {@link INTERACTIVE_SELECTOR} constant), and it is handed to `onSubmit` as a
 * plain trimmed string for US-030 to match against a fixed intent list and
 * discard. Nothing is stored, logged or sent — the prototype makes no network
 * call after load (`constraints.md` §2). Tests assert both the source scan and
 * the behaviour, using an `<img onerror>` payload.
 */

/* ------------------------------------------------------------- STRINGS -- */

/**
 * The input's accessible name. A real `<label>` carries it — visually hidden,
 * because the placeholder is the visible affordance and a placeholder is not a
 * label.
 */
export const PROMPT_INPUT_LABEL = "Ask a question about the club";

/** The send button's accessible name. Its glyph is decorative. */
export const SEND_BUTTON_LABEL = "Send question";

/** The search landmark's name, so the bar is reachable as a region. */
export const PROMPT_FORM_LABEL = "Ask the intelligence platform";

/** Visible prompt text. Guidance only, never the accessible name. */
export const PROMPT_PLACEHOLDER = "Ask anything about the club's performance";

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * Pinned to the foot of the viewport, clearing the navy sidebar at `lg`.
 *
 * FIXED, NOT STICKY. The shell clips sideways overflow (`overflow-x-hidden` on
 * `app-shell` and on the canvas), which per the CSS overflow spec makes those
 * boxes scroll containers on the other axis too — so a `sticky` bar would
 * resolve against the shell's own box, which is as tall as the content, and
 * would settle at the bottom of the DASHBOARD instead of the bottom of the
 * screen. It is also the PAGE that scrolls here, not the canvas (see
 * `scrollToTop` in `app/lib/motion.ts`), and that must stay true: US-015's
 * Reset and US-014's auto-scroll both drive the window. Fixed positioning is
 * the only option that leaves both properties alone.
 *
 * The `lg:left-*` step is the sidebar's width — `SIDEBAR_WIDTH_CLASS` in
 * `./sidebar.tsx`, which is exported so a test can assert the two agree. It is
 * restated as a literal rather than composed, because Tailwind extracts class
 * names statically and a template-built utility would never be generated.
 *
 * Full width below `lg`, where the sidebar leaves the layout entirely.
 */
export const PROMPT_BAR_POSITION_CLASS =
  "fixed inset-x-0 bottom-0 z-20 lg:left-60";

/**
 * The field: the ONLY bordered box in this component, and the only focus ring.
 *
 * The radius is the pill token — a prompt field, not a chip. `--radius-chip`
 * (11px) and its `.fcb-chip` surface belong to the segmented control and to
 * US-029's suggestion chips; the bar must not borrow them, or "11px, not fully
 * rounded" stops meaning anything.
 *
 * `focus-within` rather than `focus`: the ring has to appear when the INPUT
 * takes focus while sitting on the wrapper that draws the border, which is the
 * whole reason there is no inner box to draw it on. `--shadow-focus` is the
 * token's subtle 3px blue wash, paired with a border that deepens to blue so
 * the state survives a washed-out projector.
 */
export const PROMPT_FIELD_CLASS =
  "flex items-center gap-3 rounded-pill border border-border bg-bg px-4 py-2 shadow-tile focus-within:border-blue focus-within:shadow-focus";

/** Anything inside the field that answers a press on its own. */
const INTERACTIVE_SELECTOR = "input, button, a, textarea, select";

/* ------------------------------------------------------------- COMPONENT -- */

export interface PromptBarProps {
  /**
   * THE SUBMIT SEAM (US-030). Called with the trimmed question exactly once per
   * submitted question, and never with an empty string.
   *
   * Optional, and absent it is a no-op — the bar renders and behaves correctly
   * with no matcher attached, the same way `TopBar`'s Reset shipped before
   * US-015 supplied it. `app/root.tsx` is the one place it gets wired.
   */
  onSubmit?: (question: string) => void;
  /**
   * A render is in flight (US-031's thinking beat). The field closes, so no
   * second question can start while the first is still arriving.
   */
  busy?: boolean;
  /**
   * The row above the field — US-029's suggestion chips. They stay visible
   * through an empty submit, which is what "empty input is a no-op and the
   * chips remain visible" means in practice: nothing here removes them.
   */
  children?: ReactNode;
  className?: string;
}

export function PromptBar({
  onSubmit,
  busy = false,
  children,
  className,
}: PromptBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  /**
   * The typed text, mirrored as it is committed, so the submit path can read it
   * synchronously. React state is read from the render that created the
   * handler; two submits in one tick would both see the same pre-submit value
   * and fire twice. See the debounce note in the file header.
   */
  const draft = useRef("");

  function handleChange(event: FormEvent<HTMLInputElement>) {
    const next = event.currentTarget.value;
    draft.current = next;
    setValue(next);
  }

  function submit() {
    // A beat is already running: US-031 owns the screen until it lands.
    if (busy) return;

    const question = draft.current.trim();

    // EMPTY IS A NO-OP. Not an error, not a fallback, not a cleared field —
    // nothing happens at all and the chips above stay exactly where they are.
    if (question === "") return;

    // Cleared BEFORE the callback, so a submit re-entering in the same tick
    // reads an empty draft and takes the no-op branch above.
    draft.current = "";
    setValue("");

    onSubmit?.(question);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // A real form, so Enter and the embedded button are ONE code path (the
    // browser's implicit submission), not two hand-rolled ones. Prevented
    // because there is nowhere to navigate: this is a client-side prototype
    // that makes no request.
    event.preventDefault();
    submit();
  }

  /**
   * A press on the field's padding puts the caret in the input, so the whole
   * rounded shape behaves as the typing area it looks like.
   *
   * `mousedown` and not `click`: focus has to move before the browser decides
   * what the press focuses, and preventing the default is what stops the
   * pressed padding taking focus from the input. A press that landed on the
   * input or the send button is left completely alone, so both keep their own
   * behaviour, and nothing here touches the keyboard path.
   */
  function focusInput(event: MouseEvent<HTMLDivElement>) {
    // React types `target` as a bare `EventTarget`; a mouse press dispatched
    // inside this field always lands on the element that was pressed.
    const pressed = event.target as Element;
    if (pressed.closest(INTERACTIVE_SELECTOR)) return;

    event.preventDefault();
    inputRef.current?.focus();
  }

  return (
    <div
      data-slot="prompt-bar"
      className={cn(
        PROMPT_BAR_POSITION_CLASS,
        "border-t border-border bg-bg px-grid-gap py-3",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
        {/* US-029's chip row. Above the field, and nothing here styles it. */}
        {children}

        <form
          data-slot="prompt-form"
          role="search"
          aria-label={PROMPT_FORM_LABEL}
          aria-busy={busy}
          onSubmit={handleSubmit}
        >
          <label htmlFor={inputId} className="sr-only">
            {PROMPT_INPUT_LABEL}
          </label>

          <div
            data-slot="prompt-field"
            onMouseDown={focusInput}
            className={PROMPT_FIELD_CLASS}
          >
            {/* Decorative: the field is already named by its label. */}
            <Search
              size={16}
              aria-hidden="true"
              className="shrink-0 text-faint"
            />

            <input
              id={inputId}
              ref={inputRef}
              data-slot="prompt-input"
              type="text"
              autoComplete="off"
              value={value}
              disabled={busy}
              placeholder={PROMPT_PLACEHOLDER}
              onChange={handleChange}
              // No border and no outline of its own: the field around it draws
              // both. Removing the outline is only safe BECAUSE the focus ring
              // moved outwards to `:focus-within` on that field.
              className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-faint disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              data-slot="prompt-send"
              aria-label={SEND_BUTTON_LABEL}
              disabled={busy}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-navy text-bg disabled:opacity-50"
            >
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
