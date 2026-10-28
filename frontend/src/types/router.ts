import "@tanstack/react-router"

declare module "@tanstack/react-router" {
  /** Per-route flags read by layouts via `useMatches`. Set with `createFileRoute(...)({ staticData })`. */
  interface StaticDataRouteOption {
    /** Hide the mobile top bar and bottom tabs (full-screen pages such as event details). */
    hideMobileChrome?: boolean
  }
}
