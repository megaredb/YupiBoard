import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/format"

interface AvatarProps {
  name: string
  src?: string | null
  /** Set the size with a `size-*` class. */
  className?: string
}

export function Avatar({ name, src, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-primary",
        className,
      )}
    >
      {src ? <img src={src} alt={name} className="size-full object-cover" /> : getInitials(name)}
    </span>
  )
}
