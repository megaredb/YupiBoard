import { useEffect, useState } from "react"
import { Check, Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

/** Native share sheet where available, otherwise copies the page link. */
export function ShareButton({ title }: { title: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      }
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to recover.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={copied ? t("events.details.linkCopied") : t("events.details.share")}
      onClick={() => void share()}
      className="size-9 rounded-lg bg-card/90 shadow-sm hover:bg-card"
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
    </Button>
  )
}
