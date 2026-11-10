import { Heart } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

interface FavoriteButtonProps {
  isFavorite: boolean;
  label: string;
  onToggle: () => void;
  className?: string;
}

/** Heart laid over an event card's image; it sits outside the card link, so it never opens it. */
export function FavoriteButton({ isFavorite, label, onToggle, className }: FavoriteButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-pressed={isFavorite}
      aria-label={label}
      onClick={onToggle}
      className={cn("rounded-full bg-card/90 text-foreground shadow-sm hover:bg-card", className)}
    >
      <Heart aria-hidden className={cn("size-5", isFavorite && "fill-primary text-primary")} />
    </Button>
  );
}
