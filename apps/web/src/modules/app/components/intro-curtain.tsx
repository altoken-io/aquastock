import {
  AQUASTOCK_MARK_CURRENT_PATH,
  AQUASTOCK_MARK_DROP_PATH,
  AQUASTOCK_MARK_VIEWBOX,
} from '@aquastock/ui/brand/mark';

/**
 * Decides, before first paint, whether the intro plays: once per tab session, never under reduced
 * motion, and never when storage is unavailable (private modes can throw). It flips to "done" once
 * the hero's delayed entrances have finished, so a later client-side visit to `/` skips it.
 * Inline on purpose: a bundled script would run after the page had already painted.
 */
const INTRO_SCRIPT = `(function(){try{var d=document.documentElement,k='aq-intro';if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.dataset.intro='play';setTimeout(function(){d.dataset.intro='done'},2600)}catch(e){}})();`;

/**
 * The home page's loading screen: the brand's drop fills with water, then the curtain lifts off
 * the page (about 1.5s, first visit only). Pure CSS once the script above has run (see the
 * "Intro curtain" block in globals.css), so it never waits on hydration and never blocks input.
 * Decorative, so it is hidden from assistive tech, which reads the page underneath straight away.
 */
export function IntroCurtain({ label }: { label: string }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <div
        aria-hidden
        className="intro-curtain pointer-events-none fixed inset-0 z-100000 place-items-center bg-abyss text-abyss-foreground"
      >
        <div className="flex flex-col items-center gap-5">
          <svg
            viewBox={AQUASTOCK_MARK_VIEWBOX}
            className="size-16 overflow-visible"
            fill="none"
          >
            <defs>
              <clipPath id="intro-drop">
                <path d={AQUASTOCK_MARK_DROP_PATH} />
              </clipPath>
            </defs>
            <g clipPath="url(#intro-drop)">
              {/* The water: rises from below the drop to fill it. */}
              <rect
                className="intro-water fill-abyss-primary"
                x="0"
                y="0"
                width="32"
                height="32"
              />
            </g>
            <path
              d={AQUASTOCK_MARK_DROP_PATH}
              className="stroke-abyss-foreground/40"
              strokeWidth={1}
            />
            <path
              d={AQUASTOCK_MARK_CURRENT_PATH}
              className="stroke-abyss-foreground/70"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
          <span className="intro-word font-headline text-2xl font-medium tracking-tight">
            {label}
          </span>
        </div>
      </div>
    </>
  );
}
