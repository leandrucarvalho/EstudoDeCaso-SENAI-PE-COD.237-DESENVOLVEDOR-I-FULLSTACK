import { cn } from "@/lib/utils";

interface ClubAvatarProps {
  acronym: string;
  className?: string;
}

/** Sigla do clube num quadrado; decorativa (o nome sempre aparece ao lado). */
export function ClubAvatar({ acronym, className }: ClubAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-semibold",
        className,
      )}
    >
      {acronym}
    </span>
  );
}