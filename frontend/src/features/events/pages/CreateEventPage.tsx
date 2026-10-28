import { Link } from "@tanstack/react-router"
import { ArrowLeft, Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useGoBack } from "@/hooks/useGoBack"
import { CreateEventForm } from "../components/create/CreateEventForm"

/** /events/new: focused flow without the app header/footer. */
export function CreateEventPage() {
  const { t } = useTranslation()
  const goBack = useGoBack("/events")

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
        <Link to="/events" className="inline-flex items-center gap-2 rounded-lg">
          <img src="/images/logo.svg" alt="" className="size-7" />
          <span className="font-semibold">{t("layout.brand")}</span>
        </Link>

        <div className="mt-5 flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label={t("common.back")} onClick={goBack}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{t("createEvent.title")}</h1>
        </div>

        <p className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm text-primary">
          <Info aria-hidden className="size-4 shrink-0" />
          {t("createEvent.moderationBanner")}
        </p>

        <div className="mt-5">
          <CreateEventForm />
        </div>
      </div>
    </div>
  )
}
