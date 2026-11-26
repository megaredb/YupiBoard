import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TermsDialog } from "@/shared/components/terms-dialog";

export function TermsConsentLabel() {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);

  const handleOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      {t("auth.register.termsConfirmPrefix")}
      <Link
        to="/terms"
        onClick={handleOpen}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("auth.register.termsConfirmLink")}
      </Link>
      <TermsDialog open={isOpen} onOpenChange={setOpen} />
    </>
  );
}
