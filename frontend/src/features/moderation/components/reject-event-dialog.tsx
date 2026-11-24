import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import {
  REJECT_REASON_MAX_LENGTH,
  rejectEventSchema,
  type RejectEventFormValues,
} from "@/features/moderation/schemas/reject-event.schema";

interface RejectEventDialogProps {
  eventTitle: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** Mounted only while open, so every opening starts with an empty reason. */
export function RejectEventDialog({ eventTitle, onConfirm, onClose }: RejectEventDialogProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAppForm(rejectEventSchema, { defaultValues: { reason: "" } });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const handleReject = ({ reason }: RejectEventFormValues) => onConfirm(reason);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title>{t("admin.moderation.rejectDialog.title")}</Dialog.Title>
          <Dialog.Description>
            {t("admin.moderation.rejectDialog.description", { title: eventTitle })}
          </Dialog.Description>
        </Dialog.Header>
        <form noValidate className="space-y-4" onSubmit={handleSubmit(handleReject)}>
          <FormField
            label={t("admin.moderation.rejectDialog.reasonLabel")}
            isRequired
            error={fieldError(errors.reason?.message)}
          >
            {(fieldControl) => (
              <Textarea
                {...fieldControl}
                rows={4}
                maxLength={REJECT_REASON_MAX_LENGTH}
                placeholder={t("admin.moderation.rejectDialog.placeholder")}
                {...register("reason")}
              />
            )}
          </FormField>
          <Dialog.Footer>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="destructive">
              {t("admin.moderation.rejectDialog.confirm")}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
