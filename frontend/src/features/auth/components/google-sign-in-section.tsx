import { useTranslation } from "react-i18next"
import googleIcon from "@/assets/google.svg"
import { Button } from "@/shared/ui/button"
import { Separator } from "@/shared/ui/separator"

interface GoogleSignInSectionProps {
  label: string
  isPending: boolean
  isDisabled: boolean
  onSignIn: () => void
}

/** "Continue with Google" followed by the "or with e-mail" divider. */
export function GoogleSignInSection({
  label,
  isPending,
  isDisabled,
  onSignIn,
}: GoogleSignInSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        size="xl"
        disabled={isDisabled}
        isLoading={isPending}
        onClick={onSignIn}
        className="w-full text-sm font-medium"
      >
        <img src={googleIcon} alt="" width={16} height={16} className="size-4 shrink-0" />
        <span>{label}</span>
      </Button>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">{t("auth.orEmail")}</span>
        <Separator className="flex-1" />
      </div>
    </div>
  )
}
