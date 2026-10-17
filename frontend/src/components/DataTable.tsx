import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  srOnlyHeader?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  /** Ajusta o contorno quando a tabela fica dentro de outro cartão. */
  className?: string;
  rows: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
}

const SKELETON_ROWS = 5;

export function DataTable<T>({
  columns,
  className,
  rows,
  getRowKey,
  loading = false,
  error = null,
  onRetry,
  emptyMessage,
  emptyAction,
  toolbar,
  footer,
}: DataTableProps<T>) {
  function renderBody() {
    if (loading) {
      return Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <TableRow key={index}>
          {columns.map((column) => (
            <TableCell key={column.header}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length}>
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Não foi possível carregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {onRetry && (
              <Button variant="outline" className="mt-3" onClick={onRetry}>
                Tentar de novo
              </Button>
            )}
          </TableCell>
        </TableRow>
      );
    }

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="py-10 text-center text-muted-foreground"
          >
            <p>{emptyMessage}</p>
            {emptyAction && <div className="mt-3">{emptyAction}</div>}
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => (
      <TableRow key={getRowKey(row)}>
        {columns.map((column) => (
          <TableCell key={column.header} className={column.className}>
            {column.cell(row)}
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      {toolbar && <div className="border-b p-3">{toolbar}</div>}
      <Table aria-busy={loading}>
        <TableHeader className="bg-muted-subtle">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header} className={column.className}>
                {column.srOnlyHeader ? (
                  <span className="sr-only">{column.header}</span>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{renderBody()}</TableBody>
      </Table>
      {footer && <div className="border-t p-3">{footer}</div>}
    </div>
  );
}
