import { type PipeTransform } from '@nestjs/common';
import { type ZodType, z } from 'zod';
import { type FieldIssue, ValidationError } from './errors.js';

// Mensagens de validação em português.
z.config(z.locales.pt());

function describePath(path: PropertyKey[]): string {
  return path.map(String).join('.');
}

function toIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: describePath(issue.path),
    message: issue.message,
  }));
}

/** Validação declarativa de corpo e query params por schema Zod. */
export class ZodValidationPipe<Output> implements PipeTransform<
  unknown,
  Output
> {
  constructor(private readonly schema: ZodType<Output>) {}

  transform(value: unknown): Output {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const issues = toIssues(result.error);
    const first = issues[0];
    const message = first.field
      ? `${first.field}: ${first.message}`
      : first.message;
    throw new ValidationError(message, issues);
  }
}
