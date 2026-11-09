import { useTranslation } from "react-i18next";
import { EventStatus } from "@/shared/api/generated/model";
import { LabeledSelect } from "@/features/events/components/labeled-select";
import { EVENT_STATUS_LABEL_KEYS } from "@/features/events/lib/event-status-label-keys";

interface EventStatusSelectProps {
  /** `undefined` means every status. */
  value: EventStatus | undefined;
  onChange: (status: EventStatus | undefined) => void;
}

const ALL_STATUSES = "";

function toEventStatus(value: string): EventStatus | undefined {
  return Object.values(EventStatus).find((status) => status === value);
}

export function EventStatusSelect({ value, onChange }: EventStatusSelectProps) {
  const { t } = useTranslation();
  const options = [
    { value: ALL_STATUSES, label: t("events.myEvents.allStatuses") },
    ...Object.values(EventStatus).map((status) => ({
      value: status,
      label: t(EVENT_STATUS_LABEL_KEYS[status]),
    })),
  ];
  const handleChange = (next: string) => onChange(toEventStatus(next));

  return (
    <LabeledSelect
      label={t("events.myEvents.statusLabel")}
      value={value ?? ALL_STATUSES}
      options={options}
      onChange={handleChange}
    />
  );
}
