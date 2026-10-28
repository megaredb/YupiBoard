import { useId, useState } from "react"
import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { usePlaceSuggestions } from "../../api"
import { DEFAULT_FILTERS } from "../../constants"
import { LOCATION_OPTIONS } from "../../mocks/fixtures"

interface AddressFieldProps {
  id: string
  value: string
  /** `venueName` is set when a suggestion was picked, null when the user typed. */
  onChange: (address: string, venueName: string | null) => void
  onBlur?: () => void
  invalid?: boolean
  "aria-describedby"?: string
}

/** Text input with a suggestions dropdown (combobox pattern). Free text is allowed. */
export function AddressField({ id, value, onChange, onBlur, invalid, ...aria }: AddressFieldProps) {
  const { t } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const suggestions = usePlaceSuggestions(useDebouncedValue(value, 250), open)
  const city = LOCATION_OPTIONS.find((option) => option.id === DEFAULT_FILTERS.locationId)?.label.split(",")[0]

  const places = suggestions.data ?? []
  const showList = open && places.length > 0

  return (
    <div
      className="relative"
      onBlur={(event) => {
        // Keep the list open while focus moves between the input and the options.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          onBlur?.()
        }
      }}
    >
      <MapPin aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-describedby={aria["aria-describedby"]}
        placeholder={t("createEvent.address.placeholder")}
        className="h-10 pl-9"
        onChange={(event) => onChange(event.target.value, null)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
      />

      {showList && (
        <div id={listId} role="listbox" className="absolute z-20 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            {t("createEvent.address.suggestions", { city })}
          </p>
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(place.address, place.name)
                setOpen(false)
              }}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate text-sm">{place.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{place.address}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
