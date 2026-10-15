import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  itemName: { singular: string; plural: string };
  disabled?: boolean;
  onChange: (page: number) => void;
}

/** Até 5 números de página ao redor da página atual. */
function visiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  itemName,
  disabled = false,
  onChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);
  const noun = totalItems === 1 ? itemName.singular : itemName.plural;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        Mostrando {from}–{to} de {totalItems} {noun}
      </p>
      <nav aria-label="Paginação" className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </Button>
        {visiblePages(page, totalPages).map((number) => (
          <Button
            key={number}
            variant={number === page ? "outline" : "ghost"}
            size="sm"
            aria-current={number === page ? "page" : undefined}
            disabled={disabled}
            onClick={() => onChange(number)}
          >
            {number}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Próxima
        </Button>
      </nav>
    </div>
  );
}
