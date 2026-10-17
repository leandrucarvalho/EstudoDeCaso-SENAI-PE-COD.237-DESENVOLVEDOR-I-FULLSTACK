import { HeartPulse, Plus } from "lucide-react";
import { getInitials } from "@/lib/format";

export interface PitchSpot {
  id: number;
  /** Nome da vaga (ex.: "Defesa"), mostrado quando ela está vazia. */
  label: string;
  player?: { name: string; poorCondition: boolean };
}

/** Linhas de trás para a frente (goleiro primeiro); o ataque aparece no alto do campo. */
export function Pitch({ rows }: { rows: PitchSpot[][] }) {
  return (
    <div
      role="img"
      aria-label="Prévia dos titulares em campo"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, #14532d 0 12.5%, #0f4a28 12.5% 25%)",
      }}
      className="relative flex aspect-[3/4] flex-col-reverse justify-around overflow-hidden rounded-lg py-4 text-white"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-white/30"
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
      />
      <div
        aria-hidden
        className="absolute inset-x-[15%] bottom-0 h-[22%] border border-b-0 border-white/30"
      />
      {rows.map((row, index) => (
        <div key={index} className="relative flex justify-around">
          {row.map((spot) => (
            <div key={spot.id} className="flex flex-col items-center gap-1">
              {spot.player ? (
                <span className="relative flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold">
                  {getInitials(spot.player.name)}
                  {spot.player.poorCondition && (
                    <HeartPulse
                      aria-label="Mal condicionado"
                      className="absolute -top-1 -left-1 size-4 rounded-full bg-amber-600 p-0.5 text-white"
                    />
                  )}
                </span>
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full border border-dashed border-white/60 text-white/70">
                  <Plus aria-hidden className="size-4" />
                </span>
              )}
              <span className="rounded bg-black/50 px-1.5 text-[11px] leading-4">
                {spot.player ? spot.player.name.split(" ").at(-1) : spot.label}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
