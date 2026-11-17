import type { MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function TermsConsentLabel() {
  const { t } = useTranslation();
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      {t("auth.register.termsConfirmPrefix")}
      <Link
        to="/terms"
        onClick={handleLinkClick}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("auth.register.termsConfirmLink")}
      </Link>
    </>
  );
}
