import { useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthModeTabs } from "@/features/auth/components/auth-mode-tabs";
import { GoogleSignInSection } from "@/features/auth/components/google-sign-in-section";
import { LoginForm } from "@/features/auth/components/login-form";
import { PasswordRecoveryDialog } from "@/features/auth/components/password-recovery-dialog";
import { useGoogleSignIn } from "@/features/auth/hooks/use-google-sign-in";
import { useLogin } from "@/features/auth/hooks/use-login";
import { usePasswordRecovery } from "@/features/auth/hooks/use-password-recovery";

const route = getRouteApi("/_public/login");

export function LoginPage() {
  const { t } = useTranslation();
  const { redirect } = route.useSearch();
  const { login, isPending, errorKey } = useLogin(redirect);
  const google = useGoogleSignIn(redirect);
  const recovery = usePasswordRecovery();
  const [isRecoveryOpen, setRecoveryOpen] = useState(false);
  const shownErrorKey = errorKey ?? google.errorKey;

  const handleOpenRecovery = () => setRecoveryOpen(true);
  const handleCloseRecovery = () => {
    setRecoveryOpen(false);
    recovery.reset();
  };

  return (
    <AuthCard
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      mobileTitle={t("auth.login.mobileTitle")}
      mobileSubtitle={t("auth.login.mobileSubtitle")}
      tabs={<AuthModeTabs redirect={redirect} />}
      footer={
        <p>
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            search={{ redirect }}
            className="font-medium text-primary hover:underline"
          >
            {t("auth.login.toRegister")}
          </Link>
        </p>
      }
    >
      <GoogleSignInSection
        label={t("auth.google.continue")}
        isPending={google.isPending}
        isDisabled={isPending}
        onSignIn={google.signInWithGoogle}
      />
      {shownErrorKey && <FormAlert message={t(shownErrorKey)} />}
      <LoginForm isPending={isPending} onSubmit={login} onForgotPassword={handleOpenRecovery} />
      {isRecoveryOpen && (
        <PasswordRecoveryDialog
          onClose={handleCloseRecovery}
          isPending={recovery.isPending}
          isSent={recovery.isSent}
          errorKey={recovery.errorKey}
          onSubmit={recovery.requestRecovery}
        />
      )}
    </AuthCard>
  );
}
