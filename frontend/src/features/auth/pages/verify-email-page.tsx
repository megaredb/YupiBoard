import { getRouteApi, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@/shared/components/status-card";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { buttonVariants } from "@/shared/ui/button-variants";

const route = getRouteApi("/verify-email");

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const result = route.useLoaderData();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 p-4">
      <BrandLogo size="md" />
      {result.status === "verified" ? (
        <StatusCard
          tone="success"
          title={t("auth.verifyEmail.successTitle")}
          description={t("auth.verifyEmail.successMessage")}
        >
          <Link to="/login" className={buttonVariants({ size: "xl", className: "w-full" })}>
            {t("auth.verifyEmail.toLogin")}
          </Link>
        </StatusCard>
      ) : (
        <StatusCard
          tone="error"
          title={t("auth.verifyEmail.errorTitle")}
          description={t(
            result.status === "missing-token" ? "auth.verifyEmail.missingToken" : result.errorKey,
          )}
        >
          <Link to="/login" className={buttonVariants({ size: "xl", className: "w-full" })}>
            {t("auth.verifyEmail.toLogin")}
          </Link>
          <Link
            to="/register"
            className={buttonVariants({ variant: "outline", size: "xl", className: "w-full" })}
          >
            {t("auth.verifyEmail.toRegister")}
          </Link>
        </StatusCard>
      )}
    </div>
  );
}
