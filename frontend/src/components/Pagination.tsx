import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  disabled = false,
  onChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {totalItems} {totalItems === 1 ? "resultado" : "resultados"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm tabular-nums">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
