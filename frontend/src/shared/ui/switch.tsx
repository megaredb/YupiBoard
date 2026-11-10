import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/shared/lib/cn";

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "touch-hitbox relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-input p-0.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/80 data-checked:bg-primary dark:data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-4 rounded-full bg-white shadow-xs transition-transform data-checked:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
