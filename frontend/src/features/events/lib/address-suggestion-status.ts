import type { TranslationKey } from "@/shared/i18n/translation-key";
import type { AddressSuggestions } from "@/features/events/hooks/use-address-suggestions";

/** Events are placed at a building, so an address needs its number (the backend agrees). */
export function containsHouseNumber(text: string): boolean {
  return /\d/.test(text);
}

const STATUS_KEYS = {
  idle: null,
  searching: "events.create.addressSuggestions.searching",
  unavailable: "events.create.addressSuggestions.unavailable",
  ready: "events.create.addressSuggestions.empty",
} as const satisfies Record<AddressSuggestions["status"], TranslationKey | null>;

/** What to say in the suggestion list when it has nothing to offer. */
export function getAddressStatusKey(suggestions: AddressSuggestions): TranslationKey | null {
  if (suggestions.status === "ready" && suggestions.items.length > 0) return null;
  return STATUS_KEYS[suggestions.status];
}

/** Streets come first; once one is there, the hint asks for the building. */
export function getAddressHintKey(text: string, isPicked: boolean): TranslationKey {
  if (isPicked) return "events.create.addressSuggestions.picked";
  if (text.trim() && !containsHouseNumber(text)) {
    return "events.create.addressSuggestions.addHouseNumber";
  }
  return "events.create.fields.addressHint";
}
