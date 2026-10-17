import { HeartPulse, Volleyball } from "lucide-react";
import { getInitials } from "@/lib/format";
import {
  ATTRIBUTE_SHORT,
  formationShape,
  startersOf,
  type MatchStarter,
  type Side,
} from "@/lib/match-view";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/league";

function caption(starter: MatchStarter): string {
  const parts: string[] = [starter.position];
  if (starter.attack) {
    parts.push(
      `${ATTRIBUTE_SHORT[starter.attack.attribute] ?? starter.attack.attribute} ${starter.attack.value}`,
    );
  }
  if (starter.defense) parts.push(`Def ${starter.defense.value}`);
  return parts.join(" · ");
}

function Bubble({ starter, side }: { starter: MatchStarter; side: Side }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        className={cn(
          "relative flex size-11 items-center justify-center rounded-full border-2 border-white text-sm font-semibold",
          side === "home"
            ? "bg-primary text-primary-foreground"
            : "bg-white text-neutral-900",
        )}
      >
        {getInitials(starter.name)}
        {starter.condition === "MAL_CONDICIONADO" && (
          <HeartPulse
            aria-label="Mal condicionado"
            className="absolute -top-1 -left-1 size-4 rounded-full bg-amber-600 p-0.5 text-white"
          />
        )}
        {starter.attack?.goal && (
          <Volleyball
            aria-label="Gol no duelo"
            className="absolute -top-1 -right-1 size-4 rounded-full bg-white p-0.5 text-neutral-900"
          />
        )}
      </span>
      <span className="rounded bg-black/50 px-1.5 text-xs leading-5 whitespace-nowrap text-white">
        {starter.name}
      </span>
      <span className="rounded bg-black/40 px-1.5 text-[11px] leading-4 whitespace-nowrap text-white/80">
        {caption(starter)}
      </span>
    </div>
  );
}

/** Colunas do goleiro ao ataque, conforme a formação ("2-1-1" = 2 + 1 + 1). */
function columnsOf(match: Match, side: Side): MatchStarter[][] {
  const [goalkeeper, ...field] = startersOf(match, side);
  const [defense, midfield, attack] = formationShape(match[side].formation);
  const columns = [
    [goalkeeper],
    field.slice(0, defense),
    field.slice(defense, defense + midfield),
    field.slice(defense + midfield, defense + midfield + attack),
  ];
  return columns.filter((column) => column.length > 0);
}

export function MatchPitch({ match }: { match: Match }) {
  const home = columnsOf(match, "home");
  // O visitante ataca para a esquerda: o goleiro dele fica na ponta direita.
  const away = columnsOf(match, "away").reverse();

  return (
    <div className="relative overflow-x-auto rounded-xl bg-[#14532d]">
      <div className="relative flex min-w-[56rem] items-stretch justify-between gap-2 px-4 py-12">
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px bg-white/30"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
        />
        <span className="absolute top-3 left-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
          {match.home.club_name} {match.home.formation} | ataca →
        </span>
        <span className="absolute top-3 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
          {match.away.club_name} {match.away.formation} | ← ataca
        </span>

        {[
          { columns: home, side: "home" as const },
          { columns: away, side: "away" as const },
        ].map(({ columns, side }) => (
          <div key={side} className="relative flex flex-1 justify-around">
            {columns.map((column, index) => (
              <div key={index} className="flex flex-col justify-around gap-6">
                {column.map((starter) => (
                  <Bubble key={starter.id} starter={starter} side={side} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
