import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Popover } from "@/shared/ui/popover";

interface AttendancePopoverProps {
  trigger: ReactElement;
  /** A player already marked absent can only be switched to present. */
  canMarkAbsent: boolean;
  onMark: (attended: boolean) => void;
}

export function AttendancePopover({ trigger, canMarkAbsent, onMark }: AttendancePopoverProps) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const handlePresent = () => {
    setOpen(false);
    onMark(true);
  };
  const handleAbsent = () => {
    setOpen(false);
    onMark(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <Popover.Trigger render={trigger} />
      <Popover.Content align="center" className="w-72 space-y-3 p-4">
        <p className="text-center text-sm font-medium text-foreground">
          {t("events.attendance.popoverTitle")}
        </p>
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" onClick={handlePresent}>
            {t("events.attendance.present")}
          </Button>
          {canMarkAbsent && (
            <Button variant="outline" size="lg" className="flex-1" onClick={handleAbsent}>
              {t("events.attendance.absent")}
            </Button>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t("events.attendance.presentIsFinal")}
        </p>
      </Popover.Content>
    </Popover>
  );
}
