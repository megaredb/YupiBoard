import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@/shared/ui/alert-dialog";
import { buttonVariants } from "@/shared/ui/button-variants";

interface DisqualificationModalProps {
  reason: string | null | undefined;
}

export function DisqualificationModal({ reason }: DisqualificationModalProps) {
  const { t } = useTranslation();
  const displayReason = reason?.trim() || t("events.participants.disqualified.defaultReason");

  return (
    <AlertDialog open>
      <AlertDialog.Content className="space-y-5 text-center sm:max-w-md">
        <div className="flex flex-col items-center space-y-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert aria-hidden className="size-6" />
          </span>
          <AlertDialog.Title className="text-center text-lg font-bold">
            {t("events.participants.disqualified.title")}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-center">
            {t("events.participants.disqualified.description")}
          </AlertDialog.Description>
        </div>

        <div className="space-y-1.5 rounded-xl border border-destructive/25 bg-destructive/5 p-3.5 text-left">
          <p className="text-xs font-semibold text-destructive">
            {t("events.participants.disqualified.reasonLabel")}
          </p>
          <p className="text-sm text-foreground">{displayReason}</p>
        </div>

        <Link to="/events" className={buttonVariants({ size: "xl", className: "w-full text-sm" })}>
          {t("events.participants.disqualified.backToEvents")}
        </Link>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
