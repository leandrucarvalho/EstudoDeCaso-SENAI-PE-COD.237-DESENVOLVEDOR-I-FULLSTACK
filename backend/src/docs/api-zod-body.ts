import { ApiBody } from '@nestjs/swagger';
import { type ZodType, z } from 'zod';

/** Documenta o corpo da requisição no Swagger a partir do mesmo schema Zod usado na validação. */
export function ApiZodBody(
  schema: ZodType,
  example?: unknown,
): MethodDecorator {
  const jsonSchema = z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
    target: 'draft-7',
  });
  delete (jsonSchema as { $schema?: string }).$schema;

  return ApiBody({
    schema: { ...jsonSchema, example } as Record<string, unknown>,
  });
}
