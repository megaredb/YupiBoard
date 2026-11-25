import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { cn } from "@/shared/lib/cn";

// Same shape as Base UI's flat-list overload, so `items` keeps its item type.
type AutocompleteProps<ItemValue> = Omit<AutocompletePrimitive.Root.Props<ItemValue>, "items"> & {
  items?: readonly ItemValue[];
};

export function Autocomplete<ItemValue>(props: AutocompleteProps<ItemValue>) {
  return <AutocompletePrimitive.Root {...props} />;
}

function AutocompleteContent({ className, ...props }: AutocompletePrimitive.Popup.Props) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        sideOffset={6}
        align="start"
        className="z-50 w-(--anchor-width) outline-none"
      >
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-content"
          className={cn(
            "max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-all outline-none data-ending-style:opacity-0 data-starting-style:opacity-0",
            className,
          )}
          {...props}
        />
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  );
}

function AutocompleteItem({ className, ...props }: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-muted data-highlighted:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteStatus({ className, ...props }: AutocompletePrimitive.Status.Props) {
  return (
    <AutocompletePrimitive.Status
      className={cn("px-2.5 py-2 text-sm text-muted-foreground empty:hidden", className)}
      {...props}
    />
  );
}

Autocomplete.Input = AutocompletePrimitive.Input;
Autocomplete.Content = AutocompleteContent;
Autocomplete.List = AutocompletePrimitive.List;
Autocomplete.Item = AutocompleteItem;
Autocomplete.Status = AutocompleteStatus;
