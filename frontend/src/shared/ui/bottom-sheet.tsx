import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Backdrop } from "@/shared/ui/backdrop";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}

/** Mobile bottom sheet (same Base UI dialog primitive as `Dialog`). */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
  className,
}: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <Backdrop />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-(--keyboard-inset) z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background pb-safe transition-transform outline-none data-ending-style:translate-y-full data-starting-style:translate-y-full",
            className,
          )}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <DialogPrimitive.Title className="text-xl font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="touch-hitbox relative flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
