import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
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
import { ClubDetailDto, ClubDto, ErrorDto } from '../docs/dto.js';
import {
  type CreateClubInput,
  type ListClubsQuery,
  createClubSchema,
  listClubsQuerySchema,
} from './club.schemas.js';
import { ClubsService } from './clubs.service.js';

@ApiTags('Clubes')
@ApiResponse({
  status: 400,
  description: 'Dado, formato ou parâmetro inválido.',
  type: ErrorDto,
})
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista os clubes',
    description:
      'Ordenação por nome (padrão) ou pelo patrimônio calculado (RN11).',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['name', 'net_worth_asc', 'net_worth_desc'],
  })
  @ApiOkResponse({ type: [ClubDto] })
  list(
    @Query(new ZodValidationPipe(listClubsQuerySchema)) query: ListClubsQuery,
  ) {
    return this.clubs.list(query.sort);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Cria um clube',
    description: 'O clube nasce com 300,00 em caixa e sem jogadores (RN10).',
  })
  @ApiZodBody(createClubSchema, { name: 'Águias FC', acronym: 'AGU' })
  @ApiCreatedResponse({
    type: ClubDto,
    description: 'Cabeçalho `Location` com o novo recurso.',
  })
  @ApiResponse({
    status: 409,
    description: 'Nome ou sigla repetidos, ou limite de 20 clubes.',
    type: ErrorDto,
  })
  async create(
    @Body(new ZodValidationPipe(createClubSchema)) body: CreateClubInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const club = await this.clubs.create(body);
    response.location(`/api/v1/clubs/${club.id}`);
    return club;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulta um clube com o elenco',
    description:
      'Elenco em ordem GOL, ZAG, LAT, MEI, ATA, com contrato (fim da fidelidade, dias restantes e % de multa), valor do elenco e patrimônio (RN11).',
  })
  @ApiOkResponse({ type: ClubDetailDto })
  @ApiResponse({
    status: 404,
    description: 'Clube inexistente.',
    type: ErrorDto,
  })
  findById(@Param('id', ParseIdPipe) id: number) {
    return this.clubs.findById(id);
  }
}
