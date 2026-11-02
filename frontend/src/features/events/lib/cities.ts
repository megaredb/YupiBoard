import type { TranslationKey } from "@/shared/i18n/translation-key"

export interface City {
  id: string
  /** Backend `city` value. */
  name: string
  labelKey: TranslationKey
  /** City centre: the search origin, and the event position until geocoding exists. */
  lat: number
  lon: number
}

const KYIV: City = {
  id: "kyiv",
  name: "Kyiv",
  labelKey: "events.cities.kyiv",
  lat: 50.4501,
  lon: 30.5234,
}

export const CITIES: readonly City[] = [
  KYIV,
  { id: "lviv", name: "Lviv", labelKey: "events.cities.lviv", lat: 49.8397, lon: 24.0297 },
  { id: "kharkiv", name: "Kharkiv", labelKey: "events.cities.kharkiv", lat: 49.9935, lon: 36.2304 },
  { id: "dnipro", name: "Dnipro", labelKey: "events.cities.dnipro", lat: 48.4647, lon: 35.0462 },
]

export const DEFAULT_CITY_ID = KYIV.id

/** Unknown ids (e.g. a hand-edited URL) fall back to the default city. */
export function getCity(cityId: string): City {
  return CITIES.find((city) => city.id === cityId) ?? KYIV
}
