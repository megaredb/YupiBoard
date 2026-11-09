import { TriangleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { AlertDialog } from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

// Long labels ("Yes, cancel request") wrap inside the button instead of overflowing it.
const ACTION_CLASS = "h-auto min-h-12 px-3 py-2 text-sm leading-tight whitespace-normal";

/** Asks before an irreversible action. Mounted only while open; Esc and "cancel" close it. */
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
        <AlertDialog.Footer>
          <AlertDialog.Close
            className={buttonVariants({ variant: "outline", size: "xl", className: ACTION_CLASS })}
          >
            {cancelLabel}
          </AlertDialog.Close>
          <Button
            variant="secondary"
            size="xl"
            className={cn(ACTION_CLASS, "shadow-sm")}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
