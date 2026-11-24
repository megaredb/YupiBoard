import { MapPin } from "lucide-react";
import { useController, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { GeocodeResult } from "@/shared/api/generated/model";
import { FormField } from "@/shared/components/form-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { Autocomplete } from "@/shared/ui/autocomplete";
import { InputGroup } from "@/shared/ui/input-group";
import {
  useAddressSuggestions,
  type AddressSuggestions,
} from "@/features/events/hooks/use-address-suggestions";
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context";
import { CREATE_EVENT_LIMITS } from "@/features/events/schemas/create-event.schema";

// Base UI reports a picked suggestion with this change reason.
const ITEM_PRESS = "item-press";

const STATUS_KEYS = {
  idle: null,
  searching: "events.create.addressSuggestions.searching",
  unavailable: "events.create.addressSuggestions.unavailable",
  ready: "events.create.addressSuggestions.empty",
} as const;

function getItems(suggestions: AddressSuggestions): GeocodeResult[] {
  return suggestions.status === "ready" ? suggestions.items : [];
}

function toAddress(suggestion: GeocodeResult): string {
  return suggestion.address;
}

function SuggestionList({ statusText }: { statusText: string | null }) {
  return (
    <Autocomplete.Content>
      {statusText && <Autocomplete.Status>{statusText}</Autocomplete.Status>}
      <Autocomplete.List>
        {(item: GeocodeResult) => (
          <Autocomplete.Item key={`${item.lat},${item.lon}`} value={item}>
            <MapPin aria-hidden className="text-muted-foreground" />
            <span className="min-w-0">
              <span className="block truncate">{item.address}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.display_name}
              </span>
            </span>
          </Autocomplete.Item>
        )}
      </Autocomplete.List>
    </Autocomplete.Content>
  );
}

export function AddressField() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { control, setValue } = useCreateEventFormContext();
  const { field, fieldState } = useController({ control, name: "address" });
  const city = useWatch({ control, name: "city" });
  const picked = useWatch({ control, name: "addressLocation" });
  const suggestions = useAddressSuggestions(field.value, city);
  const items = getItems(suggestions);
  const statusKey = items.length > 0 ? null : STATUS_KEYS[suggestions.status];
  const isPickedHere = picked?.city === city;

  const handleValueChange = (value: string, details: { reason: string }) => {
    field.onChange(value);
    const suggestion =
      details.reason === ITEM_PRESS ? items.find((item) => item.address === value) : undefined;
    setValue(
      "addressLocation",
      suggestion ? { lat: suggestion.lat, lon: suggestion.lon, city } : null,
    );
  };

  return (
    <FormField
      label={t("events.create.fields.address")}
      isRequired
      hint={
        isPickedHere
          ? t("events.create.addressSuggestions.picked")
          : t("events.create.fields.addressHint")
      }
      error={fieldError(fieldState.error?.message)}
    >
      {(fieldControl) => (
        <Autocomplete
          items={items}
          value={field.value}
          onValueChange={handleValueChange}
          itemToStringValue={toAddress}
          filter={null}
        >
          <InputGroup>
            <InputGroup.Addon aria-hidden>
              <MapPin />
            </InputGroup.Addon>
            <Autocomplete.Input
              {...fieldControl}
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              maxLength={CREATE_EVENT_LIMITS.addressMax}
              placeholder={t("events.create.fields.addressPlaceholder")}
              render={<InputGroup.Input />}
            />
          </InputGroup>
          <SuggestionList statusText={statusKey && t(statusKey)} />
        </Autocomplete>
      )}
    </FormField>
  );
}
