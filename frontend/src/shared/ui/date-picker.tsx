import { useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { getTodayIsoDate, toIsoDate } from "@/shared/lib/date/iso-date";

interface DatePickerProps {
  id?: string;
  value?: string;
  min?: string;
  max?: string;
  locale?: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  variant?: "default" | "group";
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  onChange: (isoDate: string) => void;
}

interface CalendarDay {
  iso: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, idx) => {
    const cellDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + idx,
    );
    return {
      iso: toIsoDate(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
    };
  });
}

function getWeekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, idx) =>
    formatter.format(new Date(2024, 0, 1 + idx)).slice(0, 2),
  );
}

function formatDisplayDate(iso: string | undefined): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function parseInitialMonth(value: string | undefined, min: string | undefined): Date {
  const source = value || min;
  if (source) {
    const parsed = new Date(`${source}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isDateOutOfBounds(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

function CalendarDayCell({
  day,
  isSelected,
  isToday,
  isDisabled,
  onSelect,
}: {
  day: CalendarDay;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  onSelect: (iso: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(day.iso)}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-lg text-xs transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-25",
        day.isCurrentMonth ? "text-foreground" : "text-muted-foreground/45",
        isToday && "border border-primary/40 font-semibold text-primary",
        isSelected &&
          "border-transparent bg-primary font-semibold text-primary-foreground shadow-xs hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {day.dayNumber}
    </button>
  );
}

function CalendarMonthHeader({
  year,
  month,
  monthLabel,
  setViewMonth,
}: {
  year: number;
  month: number;
  monthLabel: string;
  setViewMonth: (next: Date) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        onClick={() => setViewMonth(new Date(year, month - 1, 1))}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <span className="text-sm font-semibold text-foreground capitalize">{monthLabel}</span>
      <button
        type="button"
        onClick={() => setViewMonth(new Date(year, month + 1, 1))}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function CalendarPopup({
  viewMonth,
  setViewMonth,
  todayIso,
  locale,
  value,
  min,
  max,
  onSelect,
}: {
  viewMonth: Date;
  setViewMonth: (next: Date) => void;
  todayIso: string;
  locale: string;
  value?: string;
  min?: string;
  max?: string;
  onSelect: (iso: string) => void;
}) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const days = buildCalendarGrid(year, month);
  const weekdays = getWeekdayLabels(locale);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(viewMonth);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={6} align="start" className="z-50 outline-none">
        <PopoverPrimitive.Popup className="w-72 overflow-hidden rounded-2xl border border-border bg-popover p-3.5 text-popover-foreground shadow-xl transition-all outline-none select-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <CalendarMonthHeader
            year={year}
            month={month}
            monthLabel={monthLabel}
            setViewMonth={setViewMonth}
          />
          <div className="mb-1 grid grid-cols-7 text-center">
            {weekdays.map((day, idx) => (
              <span key={idx} className="py-1 text-xs font-medium text-muted-foreground">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => (
              <CalendarDayCell
                key={day.iso}
                day={day}
                isSelected={day.iso === value}
                isToday={day.iso === todayIso}
                isDisabled={isDateOutOfBounds(day.iso, min, max)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export function DatePicker({
  id,
  value,
  min,
  max,
  locale = "en",
  placeholder = "dd.mm.yyyy",
  disabled,
  allowClear,
  variant = "default",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  onChange,
}: DatePickerProps) {
  const [isOpen, setOpen] = useState(false);
  const [todayIso] = useState(getTodayIsoDate);
  const [viewMonth, setViewMonth] = useState(() => parseInitialMonth(value, min));
  const displayValue = formatDisplayDate(value);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setViewMonth(parseInitialMonth(value, min));
    setOpen(nextOpen);
  };
  const handleSelect = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <div className="relative flex flex-1 items-center">
        <PopoverPrimitive.Trigger
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between gap-2 text-left text-sm transition-colors outline-none disabled:pointer-events-none disabled:opacity-50",
            variant === "default" &&
              "h-11 rounded-4xl border border-input bg-input/30 px-3.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive",
            variant === "group" && "h-full flex-1 bg-transparent pr-3 pl-2",
            !displayValue && "text-muted-foreground",
          )}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <CalendarIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </PopoverPrimitive.Trigger>
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="mr-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        )}
      </div>
      <CalendarPopup
        viewMonth={viewMonth}
        setViewMonth={setViewMonth}
        todayIso={todayIso}
        locale={locale}
        value={value}
        min={min}
        max={max}
        onSelect={handleSelect}
      />
    </PopoverPrimitive.Root>
  );
}
