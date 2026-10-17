import { formationRows } from "@/lib/lineup";
import type { Formation } from "@/types/league";

/** Miniatura do campo (32 x 42) com os jogadores da formação; só enfeite. */
export function FormationDiagram({ formation }: { formation: Formation }) {
  return (
    <span
      aria-hidden
      className="relative flex h-[42px] w-8 shrink-0 flex-col-reverse justify-around rounded-md bg-[#0d542b] px-1 py-1.5"
    >
      <span className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
      {formationRows(formation).map((count, row) => (
        <span key={row} className="relative flex justify-around">
          {Array.from({ length: count }, (_, dot) => (
            <span key={dot} className="size-1.5 rounded-full bg-white" />
          ))}
        </span>
      ))}
    </span>
  );
}
