export interface FieldIssue {
  field: string;
  message: string;
}

/** Base dos erros de aplicação; o filtro global traduz cada um para o código HTTP. */
export abstract class AppError extends Error {
  abstract readonly status: 400 | 404 | 409;
}

/** Dado, formato ou parâmetro inválido (400). */
export class ValidationError extends AppError {
  readonly status = 400;

  constructor(
    message: string,
    readonly issues: FieldIssue[] = [],
  ) {
    super(message);
  }
}

/** Recurso inexistente (404). */
export class NotFoundError extends AppError {
  readonly status = 404;
}

/** Regra de negócio violada (409). */
export class ConflictError extends AppError {
  readonly status = 409;
}
