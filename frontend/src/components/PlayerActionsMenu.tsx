import { Ellipsis, Eye, HeartPulse, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Player } from "@/types/player";

export type PlayerAction = "details" | "edit" | "condition" | "delete" | "buy";

interface PlayerActionsMenuProps {
  player: Player;
  onAction: (action: PlayerAction, player: Player) => void;
}

export function PlayerActionsMenu({
  player,
  onAction,
}: PlayerActionsMenuProps) {
  const hasClub = player.club_id !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ações de ${player.name}`}
        >
          <Ellipsis aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => onAction("details", player)}>
          <Eye aria-hidden />
          Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("edit", player)}>
          <Pencil aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("condition", player)}>
          <HeartPulse aria-hidden />
          Alterar condição
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={hasClub}
          title={hasClub ? "Só jogador livre pode ser excluído." : undefined}
          onSelect={() => onAction("delete", player)}
        >
          <Trash2 aria-hidden />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
