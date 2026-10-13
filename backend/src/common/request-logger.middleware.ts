import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Uma linha por requisição: método, caminho, status e duração (a data e a hora vêm do Logger). */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    response.on('finish', () => {
      const elapsed = Date.now() - startedAt;
      this.logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${elapsed}ms`,
      );
    });
    next();
  }
}
