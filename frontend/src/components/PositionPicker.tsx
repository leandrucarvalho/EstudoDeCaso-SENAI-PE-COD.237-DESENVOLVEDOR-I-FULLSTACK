import { cn } from "@/lib/utils";
import type { Position } from "@/types/player";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "GOL", label: "Goleiro" },
  { value: "ZAG", label: "Zagueiro" },
  { value: "LAT", label: "Lateral" },
  { value: "MEI", label: "Meio-campo" },
  { value: "ATA", label: "Atacante" },
];

interface PositionPickerProps {
  value: Position | "";
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (position: Position) => void;
}

export function PositionPicker({
  value,
  disabled = false,
  invalid = false,
  describedBy,
  onChange,
}: PositionPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Posição"
      aria-describedby={describedBy}
      className="grid grid-cols-5 gap-2"
    >
      {POSITIONS.map(({ value: position, label }) => {
        const selected = value === position;

        return (
          <button
            key={position}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(position)}
            className={cn(
              "flex flex-col items-center rounded-md border bg-background px-2 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-primary-soft text-primary"
                : "border-input hover:bg-muted",
              invalid && !selected && "border-destructive",
            )}
          >
            <span className="font-semibold">{position}</span>
            <span
              className={cn(
                "text-xs",
                selected ? "text-primary" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}