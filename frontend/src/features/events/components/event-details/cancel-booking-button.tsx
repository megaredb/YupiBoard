import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";

interface CancelBookingButtonProps {
  action: BookingAction;
  className?: string;
}

export function CancelBookingButton({ action, className }: CancelBookingButtonProps) {
  const { t } = useTranslation();
  const [isConfirming, setConfirming] = useState(false);
  const handleOpen = () => setConfirming(true);
  const handleClose = () => setConfirming(false);

  return (
    <>
      <Button
        variant="secondary"
        size="xl"
        className={cn("text-sm shadow-sm", className)}
        isLoading={action.isPending}
        onClick={handleOpen}
      >
        {t("events.booking.cancel")}
      </Button>
      {isConfirming && (
        <ConfirmDialog
          title={t("events.booking.cancelDialog.title")}
          description={t("events.booking.cancelDialog.description")}
          cancelLabel={t("events.booking.cancelDialog.keep")}
          confirmLabel={t("events.booking.cancelDialog.confirm")}
          onConfirm={action.cancel}
          onClose={handleClose}
        />
      )}
    </>
  );
}
