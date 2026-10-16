import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePlayer } from "@/services/players";
import type { Player } from "@/types/player";

interface DeletePlayerDialogProps {
  player: Player;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeletePlayerDialog({
  player,
  onClose,
  onDeleted,
}: DeletePlayerDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleDelete() {
    if (submitting) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await deletePlayer(player.id);
      toast.success(`${player.name} foi excluído.`);
      onDeleted();
      onClose();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir. Tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {player.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            O jogador deixa de aparecer nas listas e não poderá mais ser
            acessado. Só jogadores livres podem ser excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {apiError && (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
          >
            {submitting ? "Excluindo..." : "Excluir jogador"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}