import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseIdPipe } from '../common/parse-id.pipe.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ApiZodBody } from '../docs/api-zod-body.js';
import {
  BuyResultDto,
  ErrorDto,
  SellResultDto,
  TransactionsPageDto,
} from '../docs/dto.js';
import {
  type BuyPlayerInput,
  type TransactionFilterInput,
  buyPlayerSchema,
  transactionFilterSchema,
} from './market.schemas.js';
import { MarketService } from './market.service.js';

const TYPE_QUERY = {
  name: 'type',
  required: false,
  description:
    'Um ou mais de COMPRA e VENDA, separados por vírgula, sem espaços.',
  example: 'COMPRA,VENDA',
} as const;
const PLAYER_QUERY = {
  name: 'player_id',
  required: false,
  type: Number,
  description: 'Só as transações desse jogador no clube.',
} as const;

@ApiTags('Mercado')
@ApiResponse({
  status: 400,
  description: 'Dado, formato ou parâmetro inválido.',
  type: ErrorDto,
})
@Controller()
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post('players/:id/buy')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Compra um jogador livre',
    description:
      'Preço = valor de mercado do momento; taxa de 5% quando o valor passa de 30,00; ' +
      'custo total limitado a 50% do caixa; elenco de até 12 jogadores (RN12 a RN14). ' +
      'Cria o contrato ATIVO e grava a transação COMPRA.',
  })
  @ApiZodBody(buyPlayerSchema, {
    club_id: 1,
    loyalty_until: '2027-03-02T10:15-03:00',
  })
  @ApiOkResponse({ type: BuyResultDto })
  @ApiResponse({
    status: 404,
    description: 'Jogador ou clube inexistente.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'Jogador não livre, custo acima de 50% do caixa, elenco cheio ou recompra pelo clube que vendeu.',
    type: ErrorDto,
  })
  buy(
    @Param('id', ParseIdPipe) id: number,
    @Body(new ZodValidationPipe(buyPlayerSchema)) body: BuyPlayerInput,
  ) {
    return this.market.buy(id, body);
  }

  @Post('players/:id/sell')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Vende um jogador do elenco',
    description:
      'Vende pelo valor de mercado do momento, pelo clube atual do jogador; sem corpo. ' +
      'Antes do fim da fidelidade há multa (teto de 10,00) e, com lucro, comissão progressiva (RN15 e RN16).',
  })
  @ApiOkResponse({ type: SellResultDto })
  @ApiResponse({
    status: 404,
    description: 'Jogador inexistente ou excluído.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Jogador livre (sem clube).',
    type: ErrorDto,
  })
  sell(@Param('id', ParseIdPipe) id: number) {
    return this.market.sell(id);
  }

  @Get('clubs/:id/transactions')
  @ApiOperation({
    summary: 'Histórico de transações do clube',
    description:
      'Da mais recente para a mais antiga, com `summary` dos totais das transações filtradas (RN17).',
  })
  @ApiQuery(TYPE_QUERY)
  @ApiQuery(PLAYER_QUERY)
  @ApiOkResponse({ type: TransactionsPageDto })
  @ApiResponse({
    status: 404,
    description: 'Clube ou jogador do filtro inexistente.',
    type: ErrorDto,
  })
  history(
    @Param('id', ParseIdPipe) id: number,
    @Query(new ZodValidationPipe(transactionFilterSchema))
    filter: TransactionFilterInput,
  ) {
    return this.market.history(id, filter);
  }

  @Get('clubs/:id/transactions/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="transacoes.csv"')
  @ApiOperation({
    summary: 'Exporta o histórico em CSV',
    description:
      'Mesmos filtros do histórico; separador `;`, vírgula decimal, UTF-8 sem BOM (RN18).',
  })
  @ApiQuery(TYPE_QUERY)
  @ApiQuery(PLAYER_QUERY)
  @ApiOkResponse({
    description: 'Arquivo CSV.',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  @ApiResponse({
    status: 404,
    description: 'Clube ou jogador do filtro inexistente.',
    type: ErrorDto,
  })
  exportCsv(
    @Param('id', ParseIdPipe) id: number,
    @Query(new ZodValidationPipe(transactionFilterSchema))
    filter: TransactionFilterInput,
  ) {
    return this.market.exportCsv(id, filter);
  }
}
