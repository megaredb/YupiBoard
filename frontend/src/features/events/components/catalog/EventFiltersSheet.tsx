import { useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useEvents } from "../../api"
import { DEFAULT_FILTERS } from "../../constants"
import type { EventFilters } from "../../types"
import { EventFiltersFields } from "./EventFiltersFields"

interface EventFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Currently applied filters; the sheet edits a draft copy until "Show results". */
  value: EventFilters
  onApply: (next: EventFilters) => void
}

/** Mobile bottom sheet. Draft filters are applied with the "Show N results" button. */
export function EventFiltersSheet({ open, onOpenChange, value, onApply }: EventFiltersSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background pb-[env(safe-area-inset-bottom)] outline-none">
          {/* Remounted on every open so the draft always starts from the applied filters. */}
          {open && <SheetBody value={value} onApply={onApply} onClose={() => onOpenChange(false)} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SheetBody({
  value,
  onApply,
  onClose,
}: {
  value: EventFilters
  onApply: (next: EventFilters) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)

  // Same hook as the page, page size 1: we only want the count for the button label.
  const preview = useEvents({ ...draft, page: 1, pageSize: 1 })

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Dialog.Title className="text-xl font-semibold">{t("events.filters.title")}</Dialog.Title>
        <Dialog.Close
          aria-label={t("common.close")}
          className="flex size-9 items-center justify-center rounded-full bg-muted"
        >
          <X className="size-4" />
        </Dialog.Close>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <EventFiltersFields value={draft} onChange={setDraft} />
      </div>

      <div className="flex gap-3 border-t px-5 py-4">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
          {t("events.filters.clearAll")}
        </Button>
        <Button
          size="lg"
          className="flex-[1.5]"
          onClick={() => {
            onApply(draft)
            onClose()
          }}
        >
          {preview.data
            ? t("events.filters.showResults", { count: preview.data.total })
            : t("events.filters.show")}
        </Button>
      </div>
    </>
  )
}
