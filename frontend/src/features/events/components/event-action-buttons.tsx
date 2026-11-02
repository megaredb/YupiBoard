import { cva } from "class-variance-authority"
import { Heart, Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/button"

interface EventActionButtonsProps {
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  /** `overlay` floats on the hero image, `bar` sits in the phone top bar. */
  placement: "overlay" | "bar"
}

const actionVariants = cva("rounded-full text-foreground", {
  variants: {
    placement: {
      overlay: "bg-card/90 shadow-sm hover:bg-card",
      bar: "bg-transparent hover:bg-muted",
    },
  },
})

export function EventActionButtons({
  isFavorite,
  onToggleFavorite,
  onShare,
  placement,
}: EventActionButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={t("events.details.share")}
        onClick={onShare}
        className={actionVariants({ placement })}
      >
        <Share2 aria-hidden className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-pressed={isFavorite}
        aria-label={t("events.details.favorite")}
        onClick={onToggleFavorite}
        className={actionVariants({ placement })}
      >
        <Heart aria-hidden className={cn("size-5", isFavorite && "fill-primary text-primary")} />
      </Button>
    </div>
  )
}
