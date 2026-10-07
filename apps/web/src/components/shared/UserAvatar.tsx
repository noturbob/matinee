import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  username: string;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showOnline?: boolean;
}

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({
  src,
  username,
  displayName,
  size = "md",
  className,
  showOnline,
}: UserAvatarProps) {
  const initials = (displayName ?? username).slice(0, 2).toUpperCase();

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizes[size], className)}>
        <AvatarImage src={src ?? undefined} alt={username} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
      )}
    </div>
  );
}