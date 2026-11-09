import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/shared/lib/cn";

/** A row of chips; single choice unless `multiple`. Pressing the chosen chip again clears it. */
export function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props<string>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props<string>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "touch-hitbox relative inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-pressed:border-primary/20 data-pressed:bg-primary data-pressed:text-primary-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

ToggleGroup.Item = ToggleGroupItem;
