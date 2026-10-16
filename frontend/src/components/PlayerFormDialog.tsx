import { Info, Lock, User } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AttributePreview } from "@/components/AttributePreview";
import { FormField } from "@/components/FormField";
import { PositionPicker } from "@/components/PositionPicker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http";
import {
  ATTRIBUTE_FIELDS,
  ATTRIBUTE_LABELS,
  EMPTY_FORM,
  formFromPlayer,
  toCreateInput,
  toUpdateInput,
  validatePlayerForm,
  type PlayerFormErrors,
  type PlayerFormField,
  type PlayerFormValues,
} from "@/lib/player-form";
import { createPlayer, updatePlayer } from "@/services/players";
import type { Player } from "@/types/player";

interface PlayerFormDialogProps {
  /** Presente: edição. Ausente: cadastro. */
  player?: Player;
  onClose: () => void;
  onSaved: (player: Player) => void;
}

function LockedField({
  id,
  label,
  value,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <FormField id={id} label={label} hint={hint}>
      <div
        id={id}
        className="flex h-9 items-center gap-2 rounded-md border border-dashed bg-muted px-3 text-sm whitespace-nowrap text-muted-foreground"
      >
        <Lock aria-hidden className="size-4" />
        {value}
      </div>
    </FormField>
  );
}

export function PlayerFormDialog({
  player,
  onClose,
  onSaved,
}: PlayerFormDialogProps) {
  const editing = player !== undefined;

  const [values, setValues] = useState<PlayerFormValues>(
    player ? formFromPlayer(player) : EMPTY_FORM,
  );
  const [touched, setTouched] = useState<Set<PlayerFormField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<PlayerFormErrors>({});

  // Validação a cada tecla: `errors` é derivado dos valores, sem efeito.
  const errors = useMemo(
    () => validatePlayerForm(values, { player }),
    [values, player],
  );
  const hasErrors = Object.keys(errors).length > 0;

  // O erro só aparece depois que a pessoa mexeu no campo (ou tentou salvar).
  function shown(field: PlayerFormField): string | undefined {
    if (!submitted && !touched.has(field)) return undefined;
    return errors[field] ?? serverErrors[field];
  }

  function update<K extends keyof PlayerFormValues>(
    field: K,
    value: PlayerFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => new Set(current).add(field));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setApiError(null);
  }

  const attributesTouched =
    submitted || ATTRIBUTE_FIELDS.some((field) => touched.has(field));
  const attributesError = attributesTouched ? errors.attributes : undefined;
  const previewReady = ATTRIBUTE_FIELDS.every((field) => !errors[field]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitted(true);
    if (hasErrors) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const saved = player
        ? await updatePlayer(player.id, toUpdateInput(values))
        : await createPlayer(toCreateInput(values));

      toast.success(
        player ? "Jogador atualizado." : `${saved.name} foi cadastrado.`,
        {
          description: `Valor base ${formatMoney(saved.base_value)} · valor de mercado ${formatMoney(saved.market_value)} · overall ${saved.overall}`,
        },
      );
      onSaved(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
        const fromServer: PlayerFormErrors = {};
        for (const issue of error.issues) {
          fromServer[issue.field as PlayerFormField] = issue.message;
        }
        setServerErrors(fromServer);
      } else {
        setApiError("Não foi possível salvar. Tente de novo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const nameError = shown("name");
  const positionError = shown("position");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-4xl">
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editing ? "Editar jogador" : "Novo jogador"}
            </DialogTitle>
            <DialogDescription>
              {submitted && hasErrors
                ? "Corrija os campos destacados para salvar."
                : editing
                  ? "Nome, posição, idade e agilidade podem mudar. Os indicadores não mudam depois do cadastro."
                  : "Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar."}
            </DialogDescription>
          </DialogHeader>

          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <FormField
            id="player-name"
            label="Nome"
            hint="De 3 a 100 caracteres, com pelo menos duas palavras e sem números."
            error={nameError}
          >
            <div className="relative">
              <User
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="player-name"
                value={values.name}
                autoComplete="off"
                data-1p-ignore
                aria-invalid={Boolean(nameError)}
                aria-describedby="player-name-message"
                className="h-9 pl-9"
                onChange={(event) => update("name", event.target.value)}
              />
            </div>
          </FormField>

          <FormField id="player-position" label="Posição" error={positionError}>
            <PositionPicker
              value={values.position}
              invalid={Boolean(positionError)}
              describedBy="player-position-message"
              disabled={editing && player.club_id !== null}
              onChange={(position) => update("position", position)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="player-age"
              label="Idade"
              hint="De 16 a 45 anos."
              error={shown("age")}
            >
              <Input
                id="player-age"
                inputMode="numeric"
                value={values.age}
                aria-invalid={Boolean(shown("age"))}
                aria-describedby="player-age-message"
                className="h-9"
                onChange={(event) => update("age", event.target.value)}
              />
            </FormField>

            <FormField
              id="player-agility"
              label="Agilidade"
              hint="De 1 a 100 (até 85 com 35 anos ou mais)."
              error={shown("agility")}
            >
              <Input
                id="player-agility"
                inputMode="numeric"
                value={values.agility}
                aria-invalid={Boolean(shown("agility"))}
                aria-describedby="player-agility-message"
                className="h-9"
                onChange={(event) => update("agility", event.target.value)}
              />
            </FormField>

            <LockedField
              id="player-base-value"
              label="Valor base (moedas)"
              value={editing ? formatMoney(player.base_value) : "Após salvar"}
              hint="Calculado no cadastro."
            />
          </div>

          <section aria-labelledby="player-indicators" className="grid gap-3">
            <div className="border-t pt-4">
              <h3 id="player-indicators" className="text-base font-semibold">
                Indicadores técnicos
              </h3>
              <p className="text-sm text-muted-foreground">
                Seis atributos e o potencial, de 1 a 99. Não mudam depois do
                cadastro; a soma dos seis atributos não pode passar de 480.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
              <div className="grid grid-cols-2 content-start gap-x-3 gap-y-2 sm:grid-cols-4">
                {ATTRIBUTE_FIELDS.map((field) => (
                  <FormField
                    key={field}
                    id={`player-${field}`}
                    label={ATTRIBUTE_LABELS[field]}
                    error={shown(field)}
                  >
                    <Input
                      id={`player-${field}`}
                      inputMode="numeric"
                      value={values[field]}
                      disabled={editing}
                      aria-invalid={Boolean(shown(field))}
                      aria-describedby={`player-${field}-message`}
                      className="h-9"
                      onChange={(event) => update(field, event.target.value)}
                    />
                  </FormField>
                ))}

                <FormField
                  id="player-potential"
                  label="Potencial"
                  hint="Maior ou igual ao maior atributo; igual a ele com 33+ anos."
                  error={shown("potential")}
                >
                  <Input
                    id="player-potential"
                    inputMode="numeric"
                    value={values.potential}
                    disabled={editing}
                    aria-invalid={Boolean(shown("potential"))}
                    aria-describedby="player-potential-message"
                    className="h-9"
                    onChange={(event) =>
                      update("potential", event.target.value)
                    }
                  />
                </FormField>

                <LockedField
                  id="player-overall"
                  label="Overall"
                  value={editing ? String(player.overall) : "Após salvar"}
                  hint="Calculado automaticamente."
                />
              </div>

              <AttributePreview values={values} ready={previewReady} />
            </div>

            {attributesError && (
              <p
                role="alert"
                className="rounded-md border border-destructive-soft-border bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground"
              >
                {attributesError}
              </p>
            )}
          </section>

          <DialogFooter className="items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info aria-hidden className="size-4" />
              {editing
                ? "A posição não muda se o jogador já tem clube."
                : "O jogador começa livre e Apto."}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Salvando..."
                  : editing
                    ? "Salvar alterações"
                    : "Salvar jogador"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}