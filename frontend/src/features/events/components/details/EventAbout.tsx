import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const COLLAPSIBLE_AFTER_CHARS = 140

/** Description. On mobile long text is clamped behind "Read more". */
export function EventAbout({ description }: { description: string }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const isLong = description.length > COLLAPSIBLE_AFTER_CHARS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("events.details.about")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p
          className={cn(
            "text-sm leading-relaxed whitespace-pre-line text-muted-foreground",
            !expanded && isLong && "line-clamp-4 md:line-clamp-none",
          )}
        >
          {description}
        </p>
        {isLong && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-sm font-medium text-primary md:hidden"
          >
            {t("events.details.readMore")}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
