import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
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
import {
  ErrorDto,
  LineupDto,
  MatchDto,
  MatchSummaryDto,
  StandingDto,
} from '../docs/dto.js';
import {
  type LineupInput,
  type ListMatchesQuery,
  type PlayMatchInput,
  lineupSchema,
  listMatchesQuerySchema,
  playMatchSchema,
} from './league.schemas.js';
import { LineupService } from './lineup.service.js';
import { MatchesService } from './matches.service.js';
import { StandingsService } from './standings.service.js';

const BAD_REQUEST = {
  status: 400,
  description: 'Dado, formato ou parâmetro inválido.',
  type: ErrorDto,
} as const;

@ApiTags('Liga')
@ApiResponse(BAD_REQUEST)
@Controller()
export class LeagueController {
  constructor(
    private readonly lineup: LineupService,
    private readonly matches: MatchesService,
    private readonly standings: StandingsService,
  ) {}

  @Put('clubs/:id/lineup')
  @ApiOperation({
    summary: 'Escolhe a formação e escala os 5 titulares',
    description:
      '1 goleiro e 4 jogadores de linha que fecham a formação, todos do elenco e sem DOENTE. ' +
      'A nova escalação substitui a anterior numa única operação (RN19).',
  })
  @ApiZodBody(lineupSchema, {
    formation: '2-1-1',
    player_ids: [34, 31, 30, 33, 32],
  })
  @ApiOkResponse({ type: LineupDto })
  @ApiResponse({
    status: 404,
    description: 'Clube ou jogador inexistente.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'Jogador fora do elenco, DOENTE ou posições que não fecham a formação.',
    type: ErrorDto,
  })
  replaceLineup(
    @Param('id', ParseIdPipe) id: number,
    @Body(new ZodValidationPipe(lineupSchema)) body: LineupInput,
  ) {
    return this.lineup.replace(id, body);
  }

  @Get('clubs/:id/lineup')
  @ApiOperation({
    summary: 'Consulta a escalação do clube',
    description:
      'Sem escalação, `formation` vem nula e `complete` falso; titular vendido ou DOENTE deixa a escalação incompleta (RN19).',
  })
  @ApiOkResponse({ type: LineupDto })
  @ApiResponse({
    status: 404,
    description: 'Clube inexistente.',
    type: ErrorDto,
  })
  getLineup(@Param('id', ParseIdPipe) id: number) {
    return this.lineup.get(id);
  }

  @Post('matches')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Joga uma partida',
    description:
      'Seis duelos, sem sorteio: o mesmo confronto, nas mesmas condições, dá sempre o mesmo placar (RN20).',
  })
  @ApiZodBody(playMatchSchema, { home_club_id: 1, away_club_id: 2 })
  @ApiCreatedResponse({
    type: MatchDto,
    description: 'Cabeçalho `Location` com a nova partida.',
  })
  @ApiResponse({
    status: 404,
    description: 'Clube inexistente.',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Escalação incompleta no mandante ou no visitante.',
    type: ErrorDto,
  })
  async play(
    @Body(new ZodValidationPipe(playMatchSchema)) body: PlayMatchInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const match = await this.matches.play(body);
    response.location(`/api/v1/matches/${match.id}`);
    return match;
  }

  @Get('matches')
  @ApiOperation({
    summary: 'Histórico de partidas',
    description: 'Da mais recente para a mais antiga, sem os duelos (RN21).',
  })
  @ApiQuery({ name: 'club_id', required: false, type: Number })
  @ApiOkResponse({ type: [MatchSummaryDto] })
  @ApiResponse({
    status: 404,
    description: 'Clube do filtro inexistente.',
    type: ErrorDto,
  })
  listMatches(
    @Query(new ZodValidationPipe(listMatchesQuerySchema))
    query: ListMatchesQuery,
  ) {
    return this.matches.list(query);
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Consulta uma partida com os 6 duelos' })
  @ApiOkResponse({ type: MatchDto })
  @ApiResponse({
    status: 404,
    description: 'Partida inexistente.',
    type: ErrorDto,
  })
  getMatch(@Param('id', ParseIdPipe) id: number) {
    return this.matches.findById(id);
  }

  @Get('standings')
  @ApiOperation({
    summary: 'Classificação',
    description:
      'Todos os clubes, inclusive os que ainda não jogaram: pontos, saldo de gols, gols marcados e nome (RN21).',
  })
  @ApiOkResponse({ type: [StandingDto] })
  getStandings() {
    return this.standings.list();
  }
}
