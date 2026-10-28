import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useGoBack } from "@/hooks/useGoBack"
import type { EventDetails } from "../../types"
import { FavoriteButton } from "./FavoriteButton"
import { ShareButton } from "./ShareButton"

export function EventHero({ event }: { event: EventDetails }) {
  const { t } = useTranslation()
  const goBack = useGoBack("/events")

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-linear-to-br from-purple-200 to-primary/70 lg:aspect-[16/9] lg:rounded-xl">
      {event.coverImageUrl && (
        <img src={event.coverImageUrl} alt="" className="size-full object-cover" />
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("common.back")}
        onClick={goBack}
        className="absolute top-3 left-3 size-9 rounded-full bg-card/90 shadow-sm hover:bg-card lg:hidden"
      >
        <ArrowLeft className="size-4" />
      </Button>

      {event.isPromoted && (
        <span className="absolute bottom-3 left-3 rounded-full bg-card px-4 py-1 text-sm font-medium text-primary shadow-sm lg:top-3 lg:bottom-auto">
          {t("events.promoted")}
        </span>
      )}

      <div className="absolute top-3 right-3 flex gap-2">
        <ShareButton title={event.title} />
        <FavoriteButton eventId={event.id} isFavorite={event.viewer.isFavorite} />
      </div>
    </div>
  )
}
