import { ClubAvatar } from "@/components/ClubAvatar";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { RESULT_LABELS } from "@/lib/match-view";
import type { MatchSide, MatchSummary } from "@/types/league";

interface ScoreBoardProps {
  match: MatchSummary;
  /** Sigla por id do clube; sem ela, usa as 3 primeiras letras do nome. */
  acronyms: Map<number, string>;
  /** Mostra a formação de cada lado ("Mandante · 2-1-1"). */
  showFormation?: boolean;
}

function Team({
  side,
  role,
  acronym,
  showFormation,
  align,
}: {
  side: MatchSide;
  role: string;
  acronym: string;
  showFormation: boolean;
  align: "left" | "right";
}) {
  const text = (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="text-lg font-semibold">{side.club_name}</div>
      <div className="text-sm text-muted-foreground">
        {role}
        {showFormation && ` · ${side.formation}`}
      </div>
    </div>
  );
  const avatar = <ClubAvatar acronym={acronym} className="size-14 text-sm" />;

  return (
    <div className="flex items-center gap-3">
      {align === "right" ? (
        <>
          {text}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {text}
        </>
      )}
    </div>
  );
}

export function ScoreBoard({
  match,
  acronyms,
  showFormation = false,
}: ScoreBoardProps) {
  const acronymOf = (side: MatchSide) =>
    acronyms.get(side.club_id) ?? side.club_name.slice(0, 3).toUpperCase();

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-6">
      <Team
        side={match.home}
        role="Mandante"
        acronym={acronymOf(match.home)}
        showFormation={showFormation}
        align="right"
      />
      <div className="text-center">
        <div
          aria-label={`Placar: ${match.home.goals} a ${match.away.goals}`}
          className="rounded-lg bg-muted px-5 py-1 text-3xl font-semibold tabular-nums"
        >
          {match.home.goals} × {match.away.goals}
        </div>
        <div className="mt-1 text-sm text-muted-foreground tabular-nums">
          {formatDateTime(match.played_at).replace(" ", ", ")}
        </div>
        <Badge variant="outline" className="mt-1">
          {RESULT_LABELS[match.result]}
        </Badge>
      </div>
      <Team
        side={match.away}
        role="Visitante"
        acronym={acronymOf(match.away)}
        showFormation={showFormation}
        align="left"
      />
    </div>
  );
}
