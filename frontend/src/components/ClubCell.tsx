import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Club } from "@/types/club";
import type { Player } from "@/types/player";

interface ClubCellProps {
  player: Player;
  clubs: Map<number, Club>;
}

export function ClubCell({ player, clubs }: ClubCellProps) {
  if (player.club_id === null) {
    return <Badge variant="secondary">Livre</Badge>;
  }

  const club = clubs.get(player.club_id);
  if (!club) return <span>Clube {player.club_id}</span>;

  return (
    <span className="flex items-center gap-2">
      <Badge variant="secondary">{club.acronym}</Badge>
      <Link
        to={`/clubes/${club.id}`}
        className="underline underline-offset-2 hover:text-primary"
      >
        {club.name}
      </Link>
    </span>
  );
}
