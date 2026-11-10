import { getActiveLocale } from "@/shared/i18n/active-locale";

/** "Ukraine" / "Україна" for "UA"; the code itself when the runtime has no name for it. */
export function formatCountryName(countryCode: string): string {
  try {
    return (
      new Intl.DisplayNames([getActiveLocale()], { type: "region" }).of(countryCode) ?? countryCode
    );
  } catch {
    // Invalid region codes throw; showing the raw code is better than breaking the list.
    return countryCode;
  }
}
