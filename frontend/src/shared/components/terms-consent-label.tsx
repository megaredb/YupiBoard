import { useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { TermsDialog } from "@/shared/components/terms-dialog";

export function TermsConsentLabel() {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      {t("auth.register.termsConfirmPrefix")}
      <button
        type="button"
        onClick={handleOpen}
        className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("auth.register.termsConfirmLink")}
      </button>
      <TermsDialog open={isOpen} onOpenChange={setOpen} />
    </>
  );
}
