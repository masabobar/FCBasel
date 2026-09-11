import { useId, useState, type FormEvent } from "react";

import { cn } from "../../lib/cn";
import {
  DEMO_CREDENTIALS,
  SIGN_IN_ERROR_KEY,
  opensDemo,
} from "../../lib/demo-access";
import { useT } from "../../lib/i18n/context";
import { Crest } from "./crest";

/**
 * The cosmetic sign-in screen that stands in front of the dashboard.
 *
 * DECORATIVE BY SPECIFICATION. `constraints.md` §2 permits exactly this and no
 * more: "A cosmetic login screen is optional and, if present, decorative only."
 * Everything this component does is theatre over `app/lib/demo-access.ts` --
 * read that file before changing anything here, especially the part explaining
 * why it must not be hardened into real authentication.
 *
 * IT PRINTS THE CREDENTIAL IT ASKS FOR, and that is the point rather than an
 * oversight. The screen exists so the club's people see a familiar front door
 * on the way into the demo; a presenter who cannot get through their own front
 * door in a live room is the only real failure mode it has. The hint and the
 * check read the same constant, so they cannot drift apart.
 *
 * NO GOLD ANYWHERE IN HERE. US-044 pins gold to a closed `data-slot` allowlist
 * (target-hit marks and the follow-up accent) and asserts every painted colour
 * against `app/lib/tokens.ts`. This screen paints navy, white, surface, border,
 * text, muted and the red of the crest, all of them tokens, and adds no
 * nineteenth colour to that inventory.
 *
 * NO EM OR EN DASHES IN ANY RENDERED STRING. US-044 sweeps every text node and
 * attribute and fails on one. The copy below uses plain hyphens only.
 */

/** Everything the shell paints behind the card. Navy, as the sidebar is. */
const BACKDROP_CLASS =
  "flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-navy p-grid-gap";

/** The card itself, borrowing the tile radius and shadow. */
const CARD_CLASS =
  "w-full max-w-[420px] rounded-panel border border-border bg-bg p-8 shadow-tile";

/**
 * A form field. The border, radius and focus treatment are the prompt bar's
 * (`PROMPT_FIELD_CLASS`) reduced to a single control: one border, one ring,
 * no box inside a box, which is the structure review accepted there.
 */
const FIELD_CLASS =
  "w-full rounded-badge border border-border bg-bg px-3 py-2 text-text outline-none focus:border-blue focus:shadow-focus";

const LABEL_CLASS = "mb-1 block text-[13px] font-medium text-muted";

export interface LoginScreenProps {
  /**
   * Called once the displayed credential is entered correctly. The parent owns
   * what "signed in" means; this component decides only that the input matched.
   */
  onSignIn: () => void;
  className?: string;
}

export function LoginScreen({ onSignIn, className }: LoginScreenProps) {
  const t = useT();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rejected, setRejected] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // The form must never navigate: there is no action, no endpoint and no
    // server to post to, and a real submission would reload the document and
    // drop the memory-only session the dashboard is about to build.
    event.preventDefault();

    if (opensDemo(username, password)) {
      onSignIn();
      return;
    }

    setRejected(true);
  }

  return (
    <div data-slot="login-backdrop" className={cn(BACKDROP_CLASS, className)}>
      <div data-slot="login-card" className={CARD_CLASS}>
        <div className="mb-6 flex items-center gap-3">
          <Crest size={40} />
          {/*
           * NO WORKSPACE LABEL HERE, and the omission is deliberate (review,
           * 2026-09-11). "Sales & Marketing" is who you are once you are
           * INSIDE — the app bar states it above the dashboard it describes.
           * On the door it answered a question nobody had asked yet and made
           * the card read as two headings stacked. The crest and the product
           * name are the whole of what a front door needs.
           */}
          <p className="tile-title">{t("login.title")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className={LABEL_CLASS} htmlFor={usernameId}>
              {t("login.username")}
            </label>
            <input
              id={usernameId}
              className={FIELD_CLASS}
              type="text"
              value={username}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => {
                setUsername(event.target.value);
                setRejected(false);
              }}
            />
          </div>

          <div className="mb-4">
            <label className={LABEL_CLASS} htmlFor={passwordId}>
              {t("login.password")}
            </label>
            <input
              id={passwordId}
              className={FIELD_CLASS}
              type="password"
              value={password}
              autoComplete="off"
              onChange={(event) => {
                setPassword(event.target.value);
                setRejected(false);
              }}
              aria-describedby={rejected ? errorId : undefined}
            />
          </div>

          {/*
            The rejection is announced rather than merely coloured: the variance
            palette is the dashboard's language for good and bad numbers, and
            borrowing its red here would read as a figure rather than a message.
            `role="alert"` carries it to a screen reader, the text carries it to
            everyone else.
          */}
          {rejected && (
            <p
              id={errorId}
              role="alert"
              data-slot="login-error"
              className="mb-4 text-[13px] text-neg"
            >
              {t(SIGN_IN_ERROR_KEY)}
            </p>
          )}

          <button
            type="submit"
            data-slot="login-submit"
            className="duration-fast w-full rounded-badge bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-light"
          >
            {t("login.submit")}
          </button>
        </form>

        {/*
          THE CREDENTIAL IS PRINTED ON THE SCREEN IT OPENS. See the file header,
          and `demo-access.ts` for why that is safe: it guards seeded fixtures,
          it is in the client bundle either way, and this is a demo with no user
          accounts behind it.
        */}
        <p
          data-slot="login-hint"
          className="mt-6 border-t border-border pt-4 text-[13px] text-muted"
        >
          {t("login.hintPrefix")}{" "}
          <strong className="text-text">{DEMO_CREDENTIALS.username}</strong> /{" "}
          <strong className="text-text">{DEMO_CREDENTIALS.password}</strong>
        </p>
      </div>
    </div>
  );
}
