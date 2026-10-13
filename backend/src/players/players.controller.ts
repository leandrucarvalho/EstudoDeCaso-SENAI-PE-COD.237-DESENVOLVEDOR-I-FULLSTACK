import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ParseIdPipe } from '../common/parse-id.pipe.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ApiZodBody } from '../docs/api-zod-body.js';
import { ErrorDto, PlayerDto, PlayersPageDto } from '../docs/dto.js';
import {
  type ChangeConditionInput,
  type CreatePlayerInput,
  type ListPlayersQuery,
  type UpdatePlayerInput,
  changeConditionSchema,
  createPlayerSchema,
  listPlayersQuerySchema,
  updatePlayerSchema,
} from './player.schemas.js';
import { PlayersService } from './players.service.js';

const NEW_PLAYER_EXAMPLE = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

@ApiTags('Jogadores')
@ApiResponse({
  status: 400,
  description: 'Dado, formato ou parâmetro inválido.',
  type: ErrorDto,
})
@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista jogadores',
    description:
      'Listagem paginada com busca, filtros combináveis e ordenação (RN07). ' +
      'Filtros e ordenação por valor usam o valor de mercado.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Busca no nome (2 a 100 caracteres), sem diferenciar maiúsculas e acentos.',
  })
  @ApiQuery({
    name: 'position',
    required: false,
    enum: ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'],
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['APTO', 'MAL_CONDICIONADO', 'DOENTE'],
  })
  @ApiQuery({
    name: 'free',
    required: false,
    enum: ['true', 'false'],
    description: 'true: só livres; false: só com clube.',
  })
  @ApiQuery({ name: 'club_id', required: false, type: Number })
  @ApiQuery({ name: 'min_age', required: false, type: Number })
  @ApiQuery({ name: 'max_age', required: false, type: Number })
  @ApiQuery({
    name: 'min_value',
    required: false,
    type: Number,
    description: 'Valor de mercado mínimo (0 a 550, até 2 casas).',
  })
  @ApiQuery({
    name: 'max_value',
    required: false,
    type: Number,
    description: 'Valor de mercado máximo (0 a 550, até 2 casas).',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description:
      'name, value_asc, value_desc, age_asc, age_desc ou position; até dois, separados por vírgula.',
    example: 'value_desc,name',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: '1 a 50.',
  })
  @ApiOkResponse({ type: PlayersPageDto })
  @ApiResponse({
    status: 404,
    description: 'Clube do filtro `club_id` inexistente.',
    type: ErrorDto,
  })
  list(
    @Query(new ZodValidationPipe(listPlayersQuerySchema))
    query: ListPlayersQuery,
  ) {
    return this.players.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um jogador' })
  @ApiOkResponse({ type: PlayerDto })
  @ApiResponse({
    status: 404,
    description: 'Jogador inexistente ou excluído.',
    type: ErrorDto,
  })
  findById(@Param('id', ParseIdPipe) id: number) {
    return this.players.findById(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Cadastra um jogador',
    description:
      'O jogador nasce livre e APTO. O valor base é calculado uma única vez, no cadastro (RN06).',
  })
  @ApiZodBody(createPlayerSchema, NEW_PLAYER_EXAMPLE)
  @ApiCreatedResponse({
    type: PlayerDto,
    description: 'Cabeçalho `Location` com o novo recurso.',
  })
  async create(
    @Body(new ZodValidationPipe(createPlayerSchema)) body: CreatePlayerInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const player = await this.players.create(body);
    response.location(`/api/v1/players/${player.id}`);
    return player;
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Edita nome, posição, agilidade e idade',
    description:
      'Jogador com clube não muda de posição e a idade não pode diminuir (409). Indicadores e valor base não mudam (RN08).',
  })
  @ApiZodBody(updatePlayerSchema, {
    name: 'Davi Melo',
    position: 'MEI',
    agility: 70,
    age: 23,
  })
  @ApiOkResponse({ type: PlayerDto })
  @ApiResponse({
    status: 404,
    description: 'Jogador inexistente ou excluído.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'Mudança de posição de jogador com clube ou idade menor que a atual.',
    type: ErrorDto,
  })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body(new ZodValidationPipe(updatePlayerSchema)) body: UpdatePlayerInput,
  ) {
    return this.players.update(id, body);
  }

  @Patch(':id/condition')
  @ApiOperation({
    summary: 'Altera a condição física',
    description:
      'Fica DOENTE: sai da escalação. De DOENTE não vai direto para APTO (409). Enviar a condição atual é aceito.',
  })
  @ApiZodBody(changeConditionSchema, { condition: 'MAL_CONDICIONADO' })
  @ApiOkResponse({ type: PlayerDto })
  @ApiResponse({
    status: 404,
    description: 'Jogador inexistente ou excluído.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'De DOENTE direto para APTO.',
    type: ErrorDto,
  })
  changeCondition(
    @Param('id', ParseIdPipe) id: number,
    @Body(new ZodValidationPipe(changeConditionSchema))
    body: ChangeConditionInput,
  ) {
    return this.players.changeCondition(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Exclui um jogador livre (exclusão lógica)',
    description:
      'O jogador excluído passa a contar como inexistente em todos os endpoints (RN09).',
  })
  @ApiNoContentResponse({ description: 'Excluído.' })
  @ApiResponse({
    status: 404,
    description: 'Jogador inexistente ou já excluído.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Jogador está num clube.',
    type: ErrorDto,
  })
  async remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.players.remove(id);
  }
}
