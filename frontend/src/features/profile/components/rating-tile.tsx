import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

interface RatingTileProps {
  label: string
  icon: ReactNode
  rating: string | null
}

// Review counts are not part of `UserRead` yet, so only the rating itself is shown.
export function RatingTile({ label, icon, rating }: RatingTileProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-1">
        {icon}
        <span className="text-base font-bold text-foreground">
          {rating ?? t("common.notProvided")}
        </span>
        {rating && <span className="text-xs text-muted-foreground">{t("profile.outOfFive")}</span>}
      </div>
    </div>
  )
}
