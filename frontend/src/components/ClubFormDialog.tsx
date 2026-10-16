import { Shield, Wallet } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
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
import { ApiError } from "@/lib/http";
import {
  EMPTY_CLUB_FORM,
  toCreateClubInput,
  validateClubForm,
  type ClubFormErrors,
  type ClubFormField,
  type ClubFormValues,
} from "@/lib/club-form";
import { createClub } from "@/services/clubs";
import type { Club } from "@/types/club";

interface ClubFormDialogProps {
  onClose: () => void;
  onSaved: (club: Club) => void;
}

export function ClubFormDialog({ onClose, onSaved }: ClubFormDialogProps) {
  const [values, setValues] = useState<ClubFormValues>(EMPTY_CLUB_FORM);
  const [touched, setTouched] = useState<Set<ClubFormField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<ClubFormErrors>({});

  // Validação a cada tecla: `errors` é derivado dos valores, sem efeito.
  const errors = useMemo(() => validateClubForm(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;

  function shown(field: ClubFormField): string | undefined {
    if (!submitted && !touched.has(field)) return undefined;
    return errors[field] ?? serverErrors[field];
  }

  function update(field: ClubFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => new Set(current).add(field));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setApiError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitted(true);
    if (hasErrors) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const saved = await createClub(toCreateClubInput(values));
      toast.success(`${saved.name} foi criado.`, {
        description: "Começa com 300,00 em caixa e sem jogadores.",
      });
      onSaved(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
        const fromServer: ClubFormErrors = {};
        for (const issue of error.issues) {
          fromServer[issue.field as ClubFormField] = issue.message;
        }
        setServerErrors(fromServer);
      } else {
        setApiError("Não foi possível criar o clube. Tente de novo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const nameError = shown("name");
  const acronymError = shown("acronym");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="p-6 sm:max-w-md">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Novo clube
            </DialogTitle>
            <DialogDescription>
              Informe o nome e a sigla do clube.
            </DialogDescription>
          </DialogHeader>

          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <FormField
            id="club-name"
            label="Nome"
            hint="De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube."
            error={nameError}
          >
            <div className="relative">
              <Shield
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="club-name"
                value={values.name}
                autoComplete="off"
                data-1p-ignore
                aria-invalid={Boolean(nameError)}
                aria-describedby="club-name-message"
                className="h-9 pl-9"
                onChange={(event) => update("name", event.target.value)}
              />
            </div>
          </FormField>

          <FormField
            id="club-acronym"
            label="Sigla"
            hint="3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome."
            error={acronymError}
          >
            <Input
              id="club-acronym"
              value={values.acronym}
              maxLength={3}
              autoComplete="off"
              data-1p-ignore
              aria-invalid={Boolean(acronymError)}
              aria-describedby="club-acronym-message"
              className="h-9"
              onChange={(event) =>
                update("acronym", event.target.value.toUpperCase())
              }
            />
          </FormField>

          <p className="flex items-center gap-2 rounded-md border bg-muted-subtle px-3 py-2 text-sm text-muted-foreground">
            <Wallet aria-hidden className="size-4 shrink-0" />
            O clube começa com 300,00 em caixa e sem jogadores.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar clube"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}