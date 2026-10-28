import { useNavigate } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"
import { useToggleFavorite } from "../../api"

export function FavoriteButton({ eventId, isFavorite }: { eventId: string; isFavorite: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isSignedIn = useAuthStore((state) => state.user !== null)
  const toggle = useToggleFavorite(eventId)

  // Show the requested state immediately while the request is in flight.
  const active = toggle.isPending ? toggle.variables : isFavorite

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={active}
      aria-label={active ? t("events.details.unfavorite") : t("events.details.favorite")}
      onClick={() => (isSignedIn ? toggle.mutate(!isFavorite) : void navigate({ to: "/login" }))}
      className="size-9 rounded-lg bg-card/90 shadow-sm hover:bg-card"
    >
      <Heart className={cn("size-4", active && "fill-primary text-primary")} />
    </Button>
  )
}
