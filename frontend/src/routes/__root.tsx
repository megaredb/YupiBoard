import { createRootRoute, Link, Outlet } from "@tanstack/react-router"

export const Route = createRootRoute({
  component: () => (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <Link to="/" className="inline-block font-semibold">
        YupiBoard
      </Link>
      <Outlet />
    </div>
  ),
})
