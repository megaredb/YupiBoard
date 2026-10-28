import type { ReactNode } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  closeLabel: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Mobile bottom sheet (same Base UI dialog primitive as `ui/dialog`). */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background pb-[env(safe-area-inset-bottom)] transition-transform outline-none data-ending-style:translate-y-full data-starting-style:translate-y-full",
            className,
          )}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <DialogPrimitive.Title className="text-xl font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>

          {footer && <div className="flex gap-3 border-t px-5 py-4">{footer}</div>}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

