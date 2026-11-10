import { getRouteApi, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@/shared/components/status-card";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { buttonVariants } from "@/shared/ui/button-variants";
import { ResetPasswordCard } from "@/features/auth/components/reset-password-card";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import { getResetFailureKey } from "@/features/auth/lib/reset-token-state";

const route = getRouteApi("/reset-password");

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = route.useSearch();
  const tokenState = route.useLoaderData();
  const { resetPassword, isPending, isDone, isTokenRejected, errorKey } = useResetPassword(
    token ?? "",
  );
  const failureKey = getResetFailureKey(tokenState, isTokenRejected);
  const loginLinkClass = buttonVariants({ size: "xl", className: "w-full" });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 p-4">
      <BrandLogo size="md" />
      {isDone && (
        <StatusCard
          tone="success"
          title={t("auth.resetPassword.successTitle")}
          description={t("auth.resetPassword.successMessage")}
        >
          <Link to="/login" className={loginLinkClass}>
            {t("auth.resetPassword.toLogin")}
          </Link>
        </StatusCard>
      )}
      {!isDone && failureKey && (
        <StatusCard
          tone="error"
          title={t("auth.resetPassword.errorTitle")}
          description={t(failureKey)}
        >
          <Link to="/login" className={loginLinkClass}>
            {t("auth.resetPassword.backToLogin")}
          </Link>
        </StatusCard>
      )}
      {!isDone && !failureKey && (
        <ResetPasswordCard isPending={isPending} errorKey={errorKey} onSubmit={resetPassword} />
      )}
    </div>
  );
}
