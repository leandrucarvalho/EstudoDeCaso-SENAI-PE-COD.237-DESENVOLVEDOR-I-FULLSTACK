import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';

export const API_PREFIX = 'api/v1';
export const DOCS_PATH = `${API_PREFIX}/docs`;

/**
 * Configuração compartilhada entre a execução normal e os testes e2e:
 * prefixo, tratamento central de erros, CORS restrito e documentação interativa.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new AllExceptionsFilter());

  const origins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    exposedHeaders: ['Location', 'Content-Disposition'],
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Mercado de Jogadores')
      .setDescription(
        'API do estudo de caso SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK): jogadores, clubes, ' +
          'compra e venda com contrato de fidelidade, histórico de transações, escalação, partidas ' +
          'e classificação. Valores em moedas têm sempre 2 casas; datas usam o horário de Brasília.',
      )
      .setVersion('1.0')
      .build(),
  );
  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}/json`,
    customSiteTitle: 'Mercado de Jogadores – API',
  });
}
