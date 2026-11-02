import type { TranslationKey } from "@/shared/i18n/translation-key";

/**
 * `default`: header and footer. `standalone`: no app chrome (auth and focused flows).
 * `immersive`: the page brings its own top bar on phones, so the header is desktop-only.
 */
export type AppLayout = "default" | "standalone" | "immersive";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** The one layout flag (RT-3); the deepest match that sets it wins. */
    layout?: AppLayout;
    /** `document.title` of the page (A11Y-4). */
    titleKey?: TranslationKey;
  }
}
