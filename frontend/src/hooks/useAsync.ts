import { useCallback, useEffect, useState } from "react";

interface Settled<T> {
  fetcher: () => Promise<T>;
  attempt: number;
  data: T | null;
  error: string | null;
}

/**
 * Executa `fetcher` ao montar e sempre que ele mudar.
 * Quem chama deve estabilizar o `fetcher` com `useCallback`.
 */
export function useAsync<T>(fetcher: () => Promise<T>) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) setSettled({ fetcher, attempt, data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Erro inesperado.";
        setSettled({ fetcher, attempt, data: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  // Só vale o resultado da requisição atual; enquanto não chega, está carregando.
  const isCurrent = settled?.fetcher === fetcher && settled.attempt === attempt;

  return {
    data: settled?.data ?? null,
    error: isCurrent ? settled.error : null,
    loading: !isCurrent,
    reload,
  };
}
