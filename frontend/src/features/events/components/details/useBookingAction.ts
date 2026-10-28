import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth"
import { useApplyToEvent } from "../../api"
import type { EventDetails } from "../../types"

export interface BookingAction {
  label: string
  disabled: boolean
  isPending: boolean
  hasError: boolean
  onClick: () => void
}

/** Single source of truth for what the "Apply" button says and does. */
export function useBookingAction(event: EventDetails): BookingAction {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isSignedIn = useAuthStore((state) => state.user !== null)
  const apply = useApplyToEvent(event.id)

  const { viewer } = event
  const base = { isPending: apply.isPending, hasError: apply.isError, onClick: () => {} }

  if (viewer.isHost) return { ...base, disabled: true, label: t("events.booking.hosting") }
  if (event.status !== "upcoming") return { ...base, disabled: true, label: t("events.booking.closed") }

  if (viewer.applicationStatus === "pending") return { ...base, disabled: true, label: t("events.booking.pending") }
  if (viewer.applicationStatus === "approved") return { ...base, disabled: true, label: t("events.booking.approved") }
  if (viewer.applicationStatus === "rejected") return { ...base, disabled: true, label: t("events.booking.rejected") }

  if (event.seatsTaken >= event.seatsTotal) return { ...base, disabled: true, label: t("events.booking.full") }

  return {
    ...base,
    disabled: false,
    label: t("events.booking.apply"),
    onClick: () => {
      if (isSignedIn) apply.mutate()
      else void navigate({ to: "/login" })
    },
  }
}
