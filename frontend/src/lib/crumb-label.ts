import { useEffect, useSyncExternalStore } from "react";

// O último item do caminho (breadcrumb) mostra o nome do clube ou da partida,
// que só a página conhece. A página informa o nome; a barra de topo o lê.
let current: string | null = null;
const listeners = new Set<() => void>();

function setLabel(label: string | null) {
  current = label;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCrumbLabel(): string | null {
  return useSyncExternalStore(subscribe, () => current);
}

/** Chamado pela página: define o nome do último item do caminho enquanto ela estiver aberta. */
export function useSetCrumbLabel(label: string | null | undefined) {
  useEffect(() => {
    setLabel(label ?? null);
    return () => setLabel(null);
  }, [label]);
}
