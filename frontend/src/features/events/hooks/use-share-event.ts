import { useTranslation } from "react-i18next"
import type { EventRead } from "@/shared/api/generated/model"
import { getRuntimeConfig } from "@/shared/config/runtime-config"
import { showToast } from "@/shared/lib/toast/toast-store"
import { shareLink } from "@/shared/platform/share"

/** Shares the public web URL (the native app origin is not shareable, PLAT-3). */
export function useShareEvent(event: Pick<EventRead, "id" | "title">): () => void {
  const { t } = useTranslation()

  return () => {
    const url = new URL(`/events/${event.id}`, getRuntimeConfig().publicWebUrl).toString()
    void shareLink(event.title, url)
      .then((result) => {
        if (result === "copied") showToast(t("events.details.linkCopied"))
      })
      .catch(() => showToast(t("events.details.shareFailed"), "info"))
  }
}
