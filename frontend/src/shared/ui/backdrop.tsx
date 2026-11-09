import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/shared/lib/cn";

/** The dimmed layer behind dialogs, alert dialogs and sheets; dark in both themes. */
export function Backdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-overlay/50 backdrop-blur-xs transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}
