import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/shared/ui/button-variants";
import { useCurrentUser, useLogout } from "@/features/auth";
import { LanguageToggle } from "@/features/shell/components/language-toggle";
import { ThemeToggle } from "@/features/shell/components/theme-toggle";
import { UserMenu } from "@/features/shell/components/user-menu";

/**
 * Right side of the header. Signed-in users reach these actions from the Profile tab on phones,
 * so the phone header shows only the logo; guests keep the sign-in links everywhere.
 */
export function HeaderActions() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { logout } = useLogout();

  if (user) {
    return (
      <div className="ml-auto flex items-center gap-3 max-desktop:hidden">
        <Link to="/events/new" className={buttonVariants({ size: "lg", className: "px-4" })}>
          <Plus aria-hidden />
          {t("shell.createEvent")}
        </Link>
        <LanguageToggle />
        <ThemeToggle />
        <UserMenu user={user} onLogout={logout} />
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-3">
      <LanguageToggle />
      <ThemeToggle />
      <Link to="/login" className={buttonVariants({ variant: "ghost", size: "lg" })}>
        {t("shell.login")}
      </Link>
      <Link to="/register" className={buttonVariants({ size: "lg", className: "rounded-xl px-5" })}>
        {t("shell.register")}
      </Link>
    </div>
  );
}
