import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";
import { getInitials } from "@/features/users/lib/get-initials";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ name, avatarUrl, className, fallbackClassName }: UserAvatarProps) {
  return (
    <Avatar className={cn("border-2 border-card shadow-xs", className)}>
      {avatarUrl && <Avatar.Image src={avatarUrl} alt={name} />}
      <Avatar.Fallback className={cn("font-semibold", fallbackClassName)}>
        {getInitials(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}
