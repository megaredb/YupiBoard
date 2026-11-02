import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

const TAB_CLASS =
  "flex h-full flex-1 items-center justify-center rounded-lg text-sm font-medium text-muted-foreground"
const ACTIVE_TAB = { className: "bg-background text-foreground shadow-xs" }

/** Phone-only switch between `/login` and `/register`, keeping the post-sign-in redirect. */
export function AuthModeTabs({ redirect }: { redirect: string | undefined }) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t("auth.tabs.label")}
      className="flex h-11 w-full rounded-xl bg-muted p-1 sm:hidden"
    >
      <Link to="/login" search={{ redirect }} className={TAB_CLASS} activeProps={ACTIVE_TAB}>
        {t("auth.tabs.login")}
      </Link>
      <Link to="/register" search={{ redirect }} className={TAB_CLASS} activeProps={ACTIVE_TAB}>
        {t("auth.tabs.signUp")}
      </Link>
    </nav>
  )
}
