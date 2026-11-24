import type { ComponentProps } from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";
import { Backdrop } from "@/shared/ui/backdrop";

/** shadcn's alert dialog on base-ui: no close icon, the user must pick an action. */
export function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root {...props} />;
}

const viewportVariants = cva("fixed inset-0 z-50 flex justify-center", {
  variants: {
    layout: {
      centered: "items-center p-4",
      sheet: "items-end desktop:items-center desktop:p-4",
    },
  },
  defaultVariants: { layout: "centered" },
});

// "sheet" slides up from the bottom on phones and is a centered dialog from the desktop breakpoint.
const popupVariants = cva(
  "w-full border border-border bg-card text-card-foreground shadow-xl transition-all outline-none",
  {
    variants: {
      layout: {
        centered:
          "grid max-w-md gap-6 rounded-2xl p-6 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
        sheet:
          "flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl pb-safe data-ending-style:translate-y-full data-starting-style:translate-y-full desktop:max-w-md desktop:rounded-2xl desktop:pb-0 desktop:data-ending-style:translate-y-0 desktop:data-ending-style:scale-95 desktop:data-ending-style:opacity-0 desktop:data-starting-style:translate-y-0 desktop:data-starting-style:scale-95 desktop:data-starting-style:opacity-0",
      },
    },
    defaultVariants: { layout: "centered" },
  },
);

type AlertDialogContentProps = AlertDialogPrimitive.Popup.Props &
  VariantProps<typeof popupVariants>;

function AlertDialogContent({ className, layout, children, ...props }: AlertDialogContentProps) {
  return (
    <AlertDialogPrimitive.Portal>
      <Backdrop />
      <AlertDialogPrimitive.Viewport className={viewportVariants({ layout })}>
        <AlertDialogPrimitive.Popup
          data-slot="alert-dialog-content"
          className={cn(popupVariants({ layout }), className)}
          {...props}
        >
          {layout === "sheet" && (
            <div
              aria-hidden
              className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 desktop:hidden"
            />
          )}
          {children}
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Viewport>
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg leading-snug font-bold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("grid grid-cols-2 gap-3", className)}
      {...props}
    />
  );
}

AlertDialog.Content = AlertDialogContent;
AlertDialog.Title = AlertDialogTitle;
AlertDialog.Description = AlertDialogDescription;
AlertDialog.Footer = AlertDialogFooter;
AlertDialog.Close = AlertDialogPrimitive.Close;
