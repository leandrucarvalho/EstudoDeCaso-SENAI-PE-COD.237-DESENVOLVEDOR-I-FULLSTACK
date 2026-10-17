import { TriangleAlert } from "lucide-react";
import { useCallback, useState } from "react";
import { LineupEditor } from "@/components/LineupEditor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { getLineup } from "@/services/league";
import type { ClubDetail } from "@/types/club";

export function LineupPanel({ club }: { club: ClubDetail }) {
  const fetchLineup = useCallback(() => getLineup(club.id), [club.id]);
  const { data: lineup, error, loading, reload } = useAsync(fetchLineup);
  // Mudar a chave remonta o editor e descarta o rascunho (botão Cancelar).
  const [draftVersion, setDraftVersion] = useState(0);

  if (loading) {
    return (
      <div aria-busy className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !lineup) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar a escalação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={reload}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {!lineup.complete && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>
            Escalação incompleta: o {club.name} não pode jogar partidas
          </AlertTitle>
          <AlertDescription>
            O elenco tem {club.players.length}{" "}
            {club.players.length === 1 ? "jogador" : "jogadores"}, e a escalação
            precisa de 5: 1 goleiro e 4 jogadores de linha. Compre jogadores e
            salve a escalação com os 5 titulares.
          </AlertDescription>
        </Alert>
      )}

      <LineupEditor
        key={draftVersion}
        club={club}
        lineup={lineup}
        onSaved={reload}
        onCancel={() => setDraftVersion((version) => version + 1)}
      />
    </div>
  );
}
