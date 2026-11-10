import { useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface NativeSelectOption {
  value: string;
  label: string;
}

type NativeSelectVariant = "default" | "tinted" | "ghost";

interface NativeSelectProps extends Omit<ComponentProps<"select">, "children"> {
  options: NativeSelectOption[];
  startIcon?: ReactNode;
  variant?: NativeSelectVariant;
}

const triggerVariants = cva(
  "relative flex h-11 w-full min-w-0 cursor-pointer items-center rounded-lg pr-9 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-input bg-card text-foreground",
        tinted: "bg-primary/10 font-medium text-primary",
        ghost: "bg-transparent font-medium text-foreground",
      },
      hasIcon: { true: "pl-9", false: "pl-3" },
    },
  },
);

const iconVariants = cva("pointer-events-none absolute top-1/2 -translate-y-1/2", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      tinted: "text-primary",
      ghost: "text-muted-foreground",
    },
  },
});

function SelectOptionsPopup({
  options,
  currentValue,
  onSelect,
}: {
  options: NativeSelectOption[];
  currentValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={6} align="start" className="z-50 outline-none">
        <PopoverPrimitive.Popup className="max-h-72 min-w-(--anchor-width) overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-all outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === currentValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-selected={isSelected || undefined}
                  onClick={() => onSelect(option.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary",
                    isSelected && "bg-primary/10 font-medium text-primary",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export function NativeSelect({
  options,
  startIcon,
  variant = "default",
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  id,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: NativeSelectProps) {
  const [isOpen, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(() =>
    String(value ?? defaultValue ?? options[0]?.value ?? ""),
  );
  const currentValue = value !== undefined ? String(value) : internalValue;
  const selectedOption = options.find((opt) => opt.value === currentValue) ?? options[0];

  const handleSelect = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.({
      target: { value: nextValue, name: name ?? "" },
      currentTarget: { value: nextValue, name: name ?? "" },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        onBlur={onBlur as unknown as ComponentProps<typeof PopoverPrimitive.Trigger>["onBlur"]}
        className={cn(triggerVariants({ variant, hasIcon: Boolean(startIcon) }), className)}
      >
        {startIcon && (
          <span aria-hidden className={cn(iconVariants({ variant }), "left-3 [&_svg]:size-4")}>
            {startIcon}
          </span>
        )}
        <span className="truncate">{selectedOption?.label ?? ""}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            iconVariants({ variant }),
            "right-3 size-4 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </PopoverPrimitive.Trigger>
      <SelectOptionsPopup options={options} currentValue={currentValue} onSelect={handleSelect} />
    </PopoverPrimitive.Root>
  );
}
