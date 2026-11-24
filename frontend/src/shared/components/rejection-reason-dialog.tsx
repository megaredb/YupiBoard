import { TriangleAlert } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { AlertDialogActions } from "@/shared/components/alert-dialog-actions";
import { RejectionReasonChecklist } from "@/shared/components/rejection-reason-checklist";
import { useRejectionReasonForm } from "@/shared/hooks/use-rejection-reason-form";
import type { RejectionReasonOption } from "@/shared/lib/rejection-reason/build-rejection-reason";
import { AlertDialog } from "@/shared/ui/alert-dialog";

export interface RejectionReasonCopy {
  title: string;
  description: string;
  reasonsLabel: string;
  otherLabel: string;
  otherPlaceholder: string;
  confirmLabel: string;
  cancelLabel: string;
}

interface RejectionReasonDialogProps {
  copy: RejectionReasonCopy;
  options: readonly RejectionReasonOption[];
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

interface RejectionDialogHeaderProps {
  title: string;
  description: string;
}

function RejectionDialogHeader({ title, description }: RejectionDialogHeaderProps) {
  return (
    <>
      <div className="flex items-start gap-3.5">
        <span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-secondary/25 text-warning desktop:flex dark:bg-secondary/20 dark:text-secondary">
          <TriangleAlert aria-hidden className="size-5" />
        </span>
        <AlertDialog.Title className="min-w-0 desktop:pt-1">{title}</AlertDialog.Title>
      </div>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </>
  );
}

/** Asks for a mandatory reason before a rejection; the caller supplies the copy and the presets. */
export function RejectionReasonDialog({
  copy,
  options,
  onConfirm,
  onClose,
}: RejectionReasonDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const handleConfirmReason = (reason: string) => {
    onConfirm(reason);
    onClose();
  };
  const { form, submit } = useRejectionReasonForm(options, handleConfirmReason);

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialog.Content layout="sheet">
        <FormProvider {...form}>
          <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 pt-3 pb-4 desktop:p-6 desktop:pb-4">
              <RejectionDialogHeader title={copy.title} description={copy.description} />
              <RejectionReasonChecklist
                options={options}
                reasonsLabel={copy.reasonsLabel}
                otherLabel={copy.otherLabel}
                otherPlaceholder={copy.otherPlaceholder}
              />
            </div>
            <AlertDialogActions
              cancelLabel={copy.cancelLabel}
              confirmLabel={copy.confirmLabel}
              confirmType="submit"
              className="shrink-0 px-5 pt-2 pb-5 desktop:px-6 desktop:pb-6"
            />
          </form>
        </FormProvider>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
