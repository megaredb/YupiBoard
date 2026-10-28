import { SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EventFilters as EventFiltersValue } from "../../types"
import { EventFiltersFields } from "./EventFiltersFields"

interface EventFiltersProps {
  value: EventFiltersValue
  onChange: (next: EventFiltersValue) => void
  onClear: () => void
}

/** Desktop filter sidebar. Changes apply immediately. */
export function EventFilters({ value, onChange, onClear }: EventFiltersProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          {t("events.filters.title")}
          <SlidersHorizontal aria-hidden className="size-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <EventFiltersFields value={value} onChange={onChange} />
        <div className="border-t pt-4">
          <Button variant="outline" className="w-full" onClick={onClear}>
            {t("events.filters.clear")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
