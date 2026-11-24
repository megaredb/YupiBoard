import { cn } from "@/shared/lib/cn";
import { AlertDialog } from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";

interface AlertDialogActionsProps {
  cancelLabel: string;
  confirmLabel: string;
  /** "submit" lets the confirm button submit the surrounding form instead of calling `onConfirm`. */
  confirmType?: "button" | "submit";
  onConfirm?: () => void;
  className?: string;
}

// Long labels ("Yes, cancel request") wrap inside the button instead of overflowing it.
const ACTION_CLASS = "h-auto min-h-12 px-3 py-2 text-sm leading-tight whitespace-normal";

export function AlertDialogActions({
  cancelLabel,
  confirmLabel,
  confirmType = "button",
  onConfirm,
  className,
}: AlertDialogActionsProps) {
  return (
    <AlertDialog.Footer className={className}>
      <AlertDialog.Close
        className={buttonVariants({ variant: "outline", size: "xl", className: ACTION_CLASS })}
      >
        {cancelLabel}
      </AlertDialog.Close>
      <Button
        type={confirmType}
        variant="secondary"
        size="xl"
        className={cn(ACTION_CLASS, "shadow-sm")}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </AlertDialog.Footer>
  );
}
