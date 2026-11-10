import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/shared/lib/cn";

type SliderProps<Value extends number | readonly number[]> = SliderPrimitive.Root.Props<Value> & {
  /** One accessible name per thumb; its length sets how many thumbs are drawn. */
  thumbLabels: readonly string[];
};

export function Slider<Value extends number | readonly number[]>({
  thumbLabels,
  className,
  ...props
}: SliderProps<Value>) {
  const getThumbLabel = (index: number) => thumbLabels[index] ?? "";

  return (
    <SliderPrimitive.Root className={cn("w-full data-disabled:opacity-50", className)} {...props}>
      <SliderPrimitive.Control className="flex h-11 w-full cursor-pointer touch-none items-center select-none data-disabled:cursor-not-allowed">
        <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-border">
          <SliderPrimitive.Indicator className="rounded-full bg-primary" />
          {thumbLabels.map((label, index) => (
            <SliderPrimitive.Thumb
              key={label}
              index={index}
              getAriaLabel={getThumbLabel}
              className="touch-hitbox size-4 rounded-full border-2 border-background bg-primary shadow-xs ring-1 ring-primary outline-none has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
