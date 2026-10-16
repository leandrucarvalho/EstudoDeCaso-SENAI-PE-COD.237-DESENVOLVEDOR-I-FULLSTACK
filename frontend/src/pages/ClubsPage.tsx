import { Plus, Shield } from "lucide-react";
import { useCallback, useState } from "react";
import { ClubFormDialog } from "@/components/ClubFormDialog";
import { ClubsListHeader } from "@/components/ClubsListHeader";
import { CLUB_COLUMNS } from "@/components/clubs-table-columns";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { listClubs } from "@/services/clubs";
import type { ClubSort } from "@/types/club";

export function ClubsPage() {
  const [sort, setSort] = useState<ClubSort>("name");
  const [creating, setCreating] = useState(false);

  const fetchClubs = useCallback(() => listClubs(sort), [sort]);
  const { data, error, loading, reload } = useAsync(fetchClubs);

  return (
    <>
      <PageHeader
        icon={Shield}
        title="Clubes"
        description="Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20 clubes."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Novo clube
          </Button>
        }
      />

      <DataTable
        columns={CLUB_COLUMNS}
        rows={data ?? []}
        getRowKey={(club) => club.id}
        loading={loading}
        error={error}
        onRetry={reload}
        toolbar={
          <ClubsListHeader
            total={data?.length ?? null}
            sort={sort}
            onSortChange={setSort}
          />
        }
        emptyMessage="Nenhum clube criado ainda."
        emptyAction={
          <Button variant="outline" onClick={() => setCreating(true)}>
            Criar o primeiro clube
          </Button>
        }
      />

      <p className="mt-4 text-sm text-muted-foreground">
        Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor,
        com empate desfeito pelo nome.
      </p>

      {creating && (
        <ClubFormDialog onClose={() => setCreating(false)} onSaved={reload} />
      )}
    </>
  );
}