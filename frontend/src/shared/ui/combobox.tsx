import type { ReactNode } from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Single-value combobox: the input searches, the value is one of `items`. */
export function Combobox<Value>(props: ComboboxPrimitive.Root.Props<Value>) {
  return <ComboboxPrimitive.Root {...props} />;
}

const fieldVariants = cva(
  "relative flex h-11 w-full min-w-0 items-center rounded-lg text-sm transition-colors has-[input:disabled]:pointer-events-none has-[input:disabled]:opacity-50 has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-input bg-card text-foreground",
        tinted: "bg-primary/10 font-medium text-primary",
        ghost: "bg-transparent font-medium text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const iconClass =
  "flex size-11 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4 group-data-[variant=tinted]/combobox:text-primary";

type ComboboxFieldProps = Omit<ComboboxPrimitive.Input.Props, "className"> &
  VariantProps<typeof fieldVariants> & {
    startIcon?: ReactNode;
    /** Accessible name of the button that opens the list. */
    toggleLabel: string;
    /** Shows a button that clears the value; its accessible name. */
    clearLabel?: string;
    className?: string;
  };

function ComboboxField({
  startIcon,
  toggleLabel,
  clearLabel,
  variant,
  className,
  ...inputProps
}: ComboboxFieldProps) {
  return (
    <ComboboxPrimitive.InputGroup
      data-variant={variant ?? "default"}
      className={cn("group/combobox", fieldVariants({ variant }), className)}
    >
      {startIcon && (
        <span aria-hidden className={cn(iconClass, "-mr-2")}>
          {startIcon}
        </span>
      )}
      <ComboboxPrimitive.Input
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent outline-none placeholder:font-normal placeholder:text-muted-foreground",
          !startIcon && "pl-3",
        )}
        {...inputProps}
      />
      {clearLabel && (
        <ComboboxPrimitive.Clear aria-label={clearLabel} className={cn(iconClass, "-mr-3")}>
          <X aria-hidden />
        </ComboboxPrimitive.Clear>
      )}
      <ComboboxPrimitive.Trigger aria-label={toggleLabel} className={iconClass}>
        <ChevronDown
          aria-hidden
          className="transition-transform duration-150 group-has-[[data-popup-open]]/combobox:rotate-180"
        />
      </ComboboxPrimitive.Trigger>
    </ComboboxPrimitive.InputGroup>
  );
}

function ComboboxContent({ className, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        sideOffset={6}
        align="start"
        className="z-50 w-(--anchor-width) outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-all outline-none data-ending-style:opacity-0 data-starting-style:opacity-0",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-muted data-highlighted:text-foreground data-selected:font-medium data-selected:text-primary",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator>
        <Check aria-hidden className="size-4 shrink-0 text-primary" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn("px-2.5 py-2 text-sm text-muted-foreground empty:hidden", className)}
      {...props}
    />
  );
}

Combobox.Field = ComboboxField;
Combobox.Content = ComboboxContent;
Combobox.List = ComboboxPrimitive.List;
Combobox.Item = ComboboxItem;
Combobox.Empty = ComboboxEmpty;
