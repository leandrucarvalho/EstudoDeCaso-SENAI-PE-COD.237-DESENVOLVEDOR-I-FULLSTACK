import { ChartNoAxesColumn } from "lucide-react";
import {
  ATTRIBUTE_FIELDS,
  ATTRIBUTE_LABELS,
  parseInteger,
  type PlayerFormValues,
} from "@/lib/player-form";

interface AttributePreviewProps {
  values: PlayerFormValues;
  /** `false` enquanto algum campo dos indicadores estiver inválido. */
  ready: boolean;
}

/** Só desenha os valores digitados; não calcula overall nem valor base. */
export function AttributePreview({ values, ready }: AttributePreviewProps) {
  const potential = parseInteger(values.potential, 1, 99);

  return (
    <aside
      aria-label="Prévia dos atributos"
      className="rounded-lg border bg-muted-subtle p-4"
    >
      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <ChartNoAxesColumn aria-hidden className="size-4" />
        Prévia dos atributos
      </h3>

      {ready ? (
        <>
          <ul className="mt-3 space-y-2">
            {ATTRIBUTE_FIELDS.map((field) => {
              const value = parseInteger(values[field], 1, 99) ?? 0;

              return (
                <li key={field} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0 text-muted-foreground">
                    {ATTRIBUTE_LABELS[field]}
                  </span>
                  <div
                    aria-hidden
                    className="relative h-1.5 flex-1 rounded-full bg-muted"
                  >
                    {potential !== null && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                        style={{ width: `${potential}%` }}
                      />
                    )}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-semibold tabular-nums">
                    {value}
                  </span>
                </li>
              );
            })}
          </ul>
          {potential !== null && (
            <p className="mt-3 text-xs text-muted-foreground">
              Faixa clara: até o potencial ({potential}). A prévia só desenha os
              valores digitados; não calcula overall nem valor base.
            </p>
          )}
        </>
      ) : (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Corrija os valores destacados para ver a prévia.
        </p>
      )}
    </aside>
  );
}