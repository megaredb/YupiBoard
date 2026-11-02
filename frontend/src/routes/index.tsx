import { createFileRoute, redirect } from "@tanstack/react-router"

// `/` and `/events` are one page (RT-5).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/events", replace: true })
  },
})
