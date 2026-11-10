import { useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Clock } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface TimePickerProps {
  id?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  onChange: (time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, idx) => String(idx * 5).padStart(2, "0"));

function TimeColumn({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
}) {
  return (
    <div className="max-h-56 w-20 space-y-0.5 overflow-y-auto p-1">
      {items.map((item) => {
        const isActive = item === selected;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "flex w-full cursor-pointer items-center justify-center rounded-lg py-1.5 text-sm tabular-nums transition-colors hover:bg-primary/10 hover:text-primary",
              isActive &&
                "bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function TimePicker({
  id,
  value,
  placeholder = "--:--",
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  onChange,
}: TimePickerProps) {
  const [isOpen, setOpen] = useState(false);
  const [rawHour = "18", rawMinute = "00"] = value ? value.split(":") : [];

  const handleHourSelect = (hour: string) => {
    onChange(`${hour}:${rawMinute}`);
  };
  const handleMinuteSelect = (minute: string) => {
    onChange(`${rawHour}:${minute}`);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-4xl border border-input bg-input/30 px-3.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
          !value && "text-muted-foreground",
        )}
      >
        <span className="tabular-nums">{value || placeholder}</span>
        <Clock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} align="start" className="z-50 outline-none">
          <PopoverPrimitive.Popup className="overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl transition-all outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex divide-x divide-border">
              <TimeColumn items={HOURS} selected={rawHour} onSelect={handleHourSelect} />
              <TimeColumn items={MINUTES} selected={rawMinute} onSelect={handleMinuteSelect} />
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
