import { type PipeTransform } from '@nestjs/common';
import { NotFoundError } from './errors.js';

const MAX_ID = 2_147_483_647;

/**
 * V8: id na URL que não é inteiro positivo escrito só com dígitos, sem zeros à esquerda
 * (`abc`, `0`, `-1`, `1.5`, `01`) ou que passa de 2.147.483.647 conta como inexistente (404).
 */
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^[1-9]\d*$/.test(value))
      throw new NotFoundError('Recurso não encontrado.');
    const id = Number(value);
    if (id > MAX_ID) throw new NotFoundError('Recurso não encontrado.');
    return id;
  }
}
