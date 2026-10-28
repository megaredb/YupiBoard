import { Star } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar } from "@/components/shared/Avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Organizer } from "../../types"

export function OrganizerCard({ organizer }: { organizer: Organizer }) {
  const { t } = useTranslation()
  const memberSince = new Date(organizer.memberSince).getUTCFullYear()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("events.details.organizer")}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar name={organizer.fullName} src={organizer.avatarUrl} className="size-12" />
        <div className="min-w-0 space-y-0.5 text-sm">
          <p className="truncate font-medium">{organizer.fullName}</p>
          <p className="flex items-center gap-1 text-amber-700">
            <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
            {t("events.details.organizerRating", {
              rating: organizer.rating.toFixed(2),
              count: organizer.reviewsCount,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("events.details.organizerStats", { count: organizer.eventsHosted, year: memberSince })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
