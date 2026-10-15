import { ChevronDown, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { rangeError, toNumber, type RangeLimits } from "@/lib/players-view";

interface RangeFilterProps {
  /** Texto do botão sem filtro (ex.: "Valor de mercado"). */
  label: string;
  /** Prefixo do botão com filtro (ex.: "Valor" → "Valor: 10,00 a 60,00"). */
  shortLabel: string;
  icon: LucideIcon;
  minValue: string;
  maxValue: string;
  limits: RangeLimits;
  formatValue: (value: number) => string;
  className?: string;
  onChange: (min: string, max: string) => void;
}

export function RangeFilter({
  label,
  shortLabel,
  icon: Icon,
  minValue,
  maxValue,
  limits,
  formatValue,
  className,
  onChange,
}: RangeFilterProps) {
  const id = useId();
  const error = rangeError(minValue, maxValue, limits);
  const filled = minValue.trim() !== "" || maxValue.trim() !== "";
  const min = minValue.trim();
  const max = maxValue.trim();
  const show = (text: string) => formatValue(toNumber(text));

  let summary = label;
  if (filled && error === null) {
    if (min !== "" && max !== "") {
      summary = `${shortLabel}: ${show(min)} a ${show(max)}`;
    } else if (min !== "") {
      summary = `${shortLabel}: a partir de ${show(min)}`;
    } else {
      summary = `${shortLabel}: até ${show(max)}`;
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 rounded-md border-input bg-background px-3 text-sm font-normal shadow-xs max-md:h-10 max-md:text-base",
            className,
          )}
        >
          <Icon aria-hidden className="text-muted-foreground" />
          <span className="mr-auto truncate">{summary}</span>
          <ChevronDown aria-hidden className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-min`} className="text-sm font-medium">
              Mínimo
            </label>
            <Input
              id={`${id}-min`}
              inputMode="decimal"
              placeholder={String(limits.min)}
              value={minValue}
              aria-invalid={error !== null}
              onChange={(event) => onChange(event.target.value, maxValue)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-max`} className="text-sm font-medium">
              Máximo
            </label>
            <Input
              id={`${id}-max`}
              inputMode="decimal"
              placeholder={String(limits.max)}
              value={maxValue}
              aria-invalid={error !== null}
              onChange={(event) => onChange(minValue, event.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={!filled}
          onClick={() => onChange("", "")}
        >
          Limpar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
