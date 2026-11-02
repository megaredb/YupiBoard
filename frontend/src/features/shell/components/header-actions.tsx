import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/shared/ui/button-variants";
import { useCurrentUser, useLogout } from "@/features/auth";
import { ThemeToggle } from "@/features/shell/components/theme-toggle";
import { UserMenu } from "@/features/shell/components/user-menu";

/** Right side of the header: create, theme, and the user menu or sign-in links. */
export function HeaderActions() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { logout } = useLogout();

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-3">
      {user && (
        <Link
          to="/events/new"
          aria-label={t("shell.createEvent")}
          className={buttonVariants({ size: "lg", className: "px-3 sm:px-4" })}
        >
          <Plus aria-hidden />
          <span className="max-sm:hidden">{t("shell.createEvent")}</span>
        </Link>
      )}
      <ThemeToggle />
      {user ? (
        <UserMenu user={user} onLogout={logout} />
      ) : (
        <>
          <Link to="/login" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            {t("shell.login")}
          </Link>
          <Link
            to="/register"
            className={buttonVariants({ size: "lg", className: "rounded-xl px-5" })}
          >
            {t("shell.register")}
          </Link>
        </>
      )}
    </div>
  );
}
