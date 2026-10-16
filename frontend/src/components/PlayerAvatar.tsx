import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  className?: string;
}

/** Iniciais do nome; decorativo (o nome sempre aparece ao lado). */
export function PlayerAvatar({ name, className }: PlayerAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}