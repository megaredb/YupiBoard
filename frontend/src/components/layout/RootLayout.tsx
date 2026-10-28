import { Link, Outlet, useMatches } from "@tanstack/react-router"

// Pages that still render inside the original narrow, centered shell.
// Everything else (routes/_app/*, events.new, ...) brings its own layout.
// Once auth pages move to their own layout route this list can go away.
const NARROW_SHELL_ROUTE_IDS: readonly string[] = ["/", "/login", "/register"]

export function RootLayout() {
  const usesNarrowShell = useMatches({
    select: (matches) => matches.some((match) => NARROW_SHELL_ROUTE_IDS.includes(match.routeId)),
  })

  if (!usesNarrowShell) return <Outlet />

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <Link to="/" className="inline-block font-semibold">
        YupiBoard
      </Link>
      <Outlet />
    </div>
  )
}
