import { AlertDialog } from "@base-ui/react/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";

// Long labels ("Yes, cancel request") wrap inside the button instead of overflowing it.
const ACTION_CLASS = "h-auto min-h-12 px-3 py-2 text-sm leading-tight whitespace-normal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

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
    <AlertDialog.Root open onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-overlay/50 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup className="grid w-full max-w-md gap-6 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl transition-all outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-xs">
                <TriangleAlert aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 space-y-2 pt-0.5">
                <AlertDialog.Title className="text-lg leading-snug font-bold">
                  {title}
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </AlertDialog.Description>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AlertDialog.Close
                className={buttonVariants({
                  variant: "outline",
                  size: "xl",
                  className: ACTION_CLASS,
                })}
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
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
