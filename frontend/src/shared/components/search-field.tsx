import type { SubmitEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface SearchFieldProps {
  label: string;
  placeholder: string;
  submitLabel: string;
  maxLength: number;
  /** Initial text; remount with a new `key` to reset it from outside. */
  defaultValue: string;
  /** Called with the trimmed text when the user submits (Enter or the button). */
  onSearch: (query: string) => void;
  className?: string;
}

const QUERY_FIELD = "query";

/** Search box that commits on submit, so typing does not refetch on every keystroke. */
export function SearchField({
  label,
  placeholder,
  submitLabel,
  maxLength,
  defaultValue,
  onSearch,
  className,
}: SearchFieldProps) {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get(QUERY_FIELD);
    onSearch(typeof query === "string" ? query.trim() : "");
  };

  return (
    <search className={cn("min-w-0 flex-1", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="search"
          name={QUERY_FIELD}
          aria-label={label}
          placeholder={placeholder}
          maxLength={maxLength}
          defaultValue={defaultValue}
          className="bg-card pr-12"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label={submitLabel}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
        >
          <Search aria-hidden />
        </Button>
      </form>
    </search>
  );
}
