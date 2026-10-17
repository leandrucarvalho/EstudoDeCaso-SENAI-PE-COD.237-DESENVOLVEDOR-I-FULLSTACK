/** Contador em "pílula" ao lado do nome da aba. */
export function TabCount({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}
