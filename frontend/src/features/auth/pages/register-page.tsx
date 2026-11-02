import { getRouteApi, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { AuthCard } from "@/features/auth/components/auth-card";
import { GoogleSignInSection } from "@/features/auth/components/google-sign-in-section";
import { MobileAuthTabs } from "@/features/auth/components/mobile-auth-tabs";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useGoogleSignIn } from "@/features/auth/hooks/use-google-sign-in";
import { useRegister } from "@/features/auth/hooks/use-register";

const route = getRouteApi("/_public/register");

export function RegisterPage() {
  const { t } = useTranslation();
  const { redirect } = route.useSearch();
  const { register, isPending, errorKey } = useRegister(redirect);
  const google = useGoogleSignIn(redirect);
  const shownErrorKey = errorKey ?? google.errorKey;

  return (
    <AuthCard
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      tabs={<MobileAuthTabs redirect={redirect} />}
      footer={
        <p>
          {t("auth.register.hasAccount")}{" "}
          <Link
            to="/login"
            search={{ redirect }}
            className="font-medium text-primary hover:underline"
          >
            {t("auth.register.toLogin")}
          </Link>
        </p>
      }
    >
      <GoogleSignInSection
        label={t("auth.google.signUp")}
        isPending={google.isPending}
        isDisabled={isPending}
        onSignIn={google.signInWithGoogle}
      />
      {shownErrorKey && <FormAlert message={t(shownErrorKey)} />}
      <RegisterForm isPending={isPending} onSubmit={register} />
    </AuthCard>
  );
}
