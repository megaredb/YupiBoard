import type { SubmitEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { InputGroup } from "@/shared/ui/input-group";

interface SearchFieldProps {
  label: string;
  placeholder: string;
  submitLabel: string;
  maxLength: number;
  /** Initial text; remount with a new `key` to reset it from outside. */
  defaultValue: string;
  onSearch: (query: string) => void;
  className?: string;
}

const QUERY_FIELD = "query";

/** Commits on submit, so typing does not refetch on every keystroke. */
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
      <form onSubmit={handleSubmit}>
        <InputGroup className="bg-card">
          <InputGroup.Input
            type="search"
            name={QUERY_FIELD}
            aria-label={label}
            placeholder={placeholder}
            maxLength={maxLength}
            defaultValue={defaultValue}
          />
          <InputGroup.Addon align="inline-end">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label={submitLabel}
              className="text-muted-foreground"
            >
              <Search aria-hidden />
            </Button>
          </InputGroup.Addon>
        </InputGroup>
      </form>
    </search>
  );
}
