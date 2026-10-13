import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppError, ValidationError } from './errors.js';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  errors?: { field: string; message: string }[];
}

const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  413: 'Payload Too Large',
  500: 'Internal Server Error',
};

/**
 * Tratamento central de erros: toda recusa sai como JSON com `message` e sem stack trace,
 * e uma falha inesperada vira 500 (a operação já foi desfeita pela transação).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof ValidationError) {
      return this.build(400, exception.message, exception.issues);
    }
    if (exception instanceof AppError) {
      return this.build(exception.status, exception.message);
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return this.build(status, this.httpMessage(status));
    }
    if (this.isBodyParserError(exception)) {
      return this.build(400, 'O corpo da requisição não é um JSON válido.');
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    return this.build(500, 'Erro interno do servidor.');
  }

  private build(
    statusCode: number,
    message: string,
    issues: { field: string; message: string }[] = [],
  ): ErrorBody {
    const body: ErrorBody = {
      statusCode,
      error: STATUS_NAMES[statusCode] ?? 'Error',
      message,
    };
    if (issues.length > 0) body.errors = issues;
    return body;
  }

  private httpMessage(status: number): string {
    if (status === 404) return 'Recurso não encontrado.';
    if (status === 405) return 'Método não permitido.';
    return 'Requisição inválida.';
  }

  /** Erros do `body-parser` (JSON malformado) chegam como objetos com `status` 4xx. */
  private isBodyParserError(exception: unknown): boolean {
    const candidate = exception as { status?: unknown; type?: unknown };
    return (
      typeof candidate === 'object' &&
      candidate !== null &&
      typeof candidate.status === 'number' &&
      candidate.status >= 400 &&
      candidate.status < 500 &&
      typeof candidate.type === 'string'
    );
  }
}
