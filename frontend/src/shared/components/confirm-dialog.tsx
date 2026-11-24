import { TriangleAlert } from "lucide-react";
import { AlertDialogActions } from "@/shared/components/alert-dialog-actions";
import { AlertDialog } from "@/shared/ui/alert-dialog";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialog.Content>
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-xs">
            <TriangleAlert aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 space-y-2 pt-0.5">
            <AlertDialog.Title>{title}</AlertDialog.Title>
            <AlertDialog.Description>{description}</AlertDialog.Description>
          </div>
        </div>
        <AlertDialogActions
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          onConfirm={handleConfirm}
        />
      </AlertDialog.Content>
    </AlertDialog>
  );
}
