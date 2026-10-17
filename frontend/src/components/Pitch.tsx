import { getInitials } from "@/lib/format";

export interface PitchPlayer {
  id: number;
  name: string;
}

/** Linhas de trás para a frente (goleiro primeiro); o ataque aparece no alto do campo. */
export function Pitch({ rows }: { rows: PitchPlayer[][] }) {
  return (
    <div
      role="img"
      aria-label="Prévia dos titulares em campo"
      className="relative flex aspect-[3/4] flex-col-reverse justify-around overflow-hidden rounded-lg bg-[#14532d] py-4 text-white"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-white/30"
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
      />
      {rows.map((row, index) => (
        <div key={index} className="relative flex justify-around">
          {row.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-1">
              <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold">
                {getInitials(player.name)}
              </span>
              <span className="rounded bg-black/50 px-1.5 text-[11px] leading-4">
                {player.name.split(" ").at(-1)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
