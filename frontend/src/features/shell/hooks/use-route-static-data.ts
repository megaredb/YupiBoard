import { useMatches } from "@tanstack/react-router"
import type { AppLayout } from "@/shared/config/route-static-data"
import type { TranslationKey } from "@/shared/i18n/translation-key"

interface RouteStaticData {
  layout: AppLayout
  titleKey: TranslationKey | null
}

/** Layout and title of the deepest matched route that declares them. */
export function useRouteStaticData(): RouteStaticData {
  const layout = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.layout)?.staticData.layout,
  })
  const titleKey = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.titleKey)?.staticData.titleKey,
  })
  return { layout: layout ?? "default", titleKey: titleKey ?? null }
}
