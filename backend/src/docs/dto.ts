import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Classes usadas só para documentar as respostas no Swagger; os objetos reais são montados
 * pelos mapeadores de cada módulo.
 */

export class ErrorFieldDto {
  @ApiProperty({ example: 'agility' }) field!: string;
  @ApiProperty({ example: 'deve ser no máximo 100' }) message!: string;
}

export class ErrorDto {
  @ApiProperty({ example: 409 }) statusCode!: number;
  @ApiProperty({ example: 'Conflict' }) error!: string;
  @ApiProperty({
    example:
      'O custo da compra (50,40) passa do limite de 50% do caixa (50,00).',
  })
  message!: string;
  @ApiPropertyOptional({ type: [ErrorFieldDto] }) errors?: ErrorFieldDto[];
}

export class PlayerDto {
  @ApiProperty({ example: 2 }) id!: number;
  @ApiProperty({ example: 'Meia Lua' }) name!: string;
  @ApiProperty({ enum: ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'], example: 'MEI' })
  position!: string;
  @ApiProperty({ example: 85 }) agility!: number;
  @ApiProperty({ example: 25 }) age!: number;
  @ApiProperty({
    enum: ['APTO', 'MAL_CONDICIONADO', 'DOENTE'],
    example: 'MAL_CONDICIONADO',
  })
  condition!: string;
  @ApiProperty({
    example: 40.0,
    description: 'Calculado uma vez, no cadastro (RN06).',
  })
  base_value!: number;
  @ApiProperty({
    example: 37.0,
    description: 'Calculado a cada consulta (RN05).',
  })
  market_value!: number;
  @ApiProperty({ example: 70 }) pace!: number;
  @ApiProperty({ example: 68 }) shooting!: number;
  @ApiProperty({ example: 82 }) passing!: number;
  @ApiProperty({ example: 79 }) dribbling!: number;
  @ApiProperty({ example: 55 }) defending!: number;
  @ApiProperty({ example: 64 }) physical!: number;
  @ApiProperty({ example: 86 }) potential!: number;
  @ApiProperty({
    example: 75,
    description: 'Calculado a cada consulta (RN06).',
  })
  overall!: number;
  @ApiProperty({ example: null, nullable: true, type: Number }) club_id!:
    number | null;
}

export class PageMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 10 }) limit!: number;
  @ApiProperty({ example: 23 }) total_items!: number;
  @ApiProperty({ example: 3 }) total_pages!: number;
}

export class PlayersPageDto {
  @ApiProperty({ type: [PlayerDto] }) data!: PlayerDto[];
  @ApiProperty({ type: PageMetaDto }) meta!: PageMetaDto;
}

export class ContractViewDto {
  @ApiProperty({ example: 37.0 }) purchase_value!: number;
  @ApiProperty({ example: '2027-03-02T10:15:00-03:00' }) loyalty_until!: string;
  @ApiProperty({ example: 120 }) remaining_days!: number;
  @ApiProperty({
    example: 10,
    description: 'Percentual da multa se vendido agora (RN15).',
  })
  penalty_rate!: number;
}

export class SquadPlayerDto extends PlayerDto {
  @ApiProperty({ type: ContractViewDto }) contract!: ContractViewDto;
}

export class ClubDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Águias FC' }) name!: string;
  @ApiProperty({ example: 'AGU' }) acronym!: string;
  @ApiProperty({ example: 261.15 }) cash!: number;
  @ApiProperty({ example: 37.0 }) squad_value!: number;
  @ApiProperty({ example: 298.15 }) net_worth!: number;
}

export class ClubDetailDto extends ClubDto {
  @ApiProperty({ type: [SquadPlayerDto] }) players!: SquadPlayerDto[];
}

export class TransactionDto {
  @ApiProperty({ example: 10 }) id!: number;
  @ApiProperty({ example: 1 }) club_id!: number;
  @ApiProperty({ example: 2 }) player_id!: number;
  @ApiProperty({ example: 'Meia Lua' }) player_name!: string;
  @ApiProperty({ enum: ['COMPRA', 'VENDA'] }) type!: string;
  @ApiProperty({ example: 37.0 }) value!: number;
  @ApiProperty({
    example: 1.85,
    description: 'Taxa de compra ou comissão de venda.',
  })
  fee!: number;
  @ApiProperty({ example: 0.0 }) penalty!: number;
  @ApiProperty({ example: null, nullable: true, type: Number }) profit!:
    number | null;
  @ApiProperty({ example: -38.85 }) cash_change!: number;
  @ApiProperty({ example: '2026-11-02T10:15:00-03:00' }) created_at!: string;
}

export class CreatedContractDto {
  @ApiProperty({ example: 37.0 }) purchase_value!: number;
  @ApiProperty({ example: '2027-03-02T10:15:00-03:00' }) loyalty_until!: string;
  @ApiProperty({ example: 'ATIVO' }) status!: string;
}

export class BuyResultDto extends TransactionDto {
  @ApiProperty({ type: CreatedContractDto }) contract!: CreatedContractDto;
  @ApiProperty({ example: 261.15 }) club_cash!: number;
}

export class SellResultDto extends TransactionDto {
  @ApiProperty({ example: 37.0 }) purchase_value!: number;
  @ApiProperty({ example: 117 }) remaining_days!: number;
  @ApiProperty({ example: 10 }) penalty_rate!: number;
  @ApiProperty({ enum: ['ENCERRADO', 'RESCINDIDO'] }) contract_status!: string;
  @ApiProperty({ example: 296.85 }) club_cash!: number;
}

export class TransactionsSummaryDto {
  @ApiProperty({ example: 38.85 }) total_spent!: number;
  @ApiProperty({ example: 35.7 }) total_received!: number;
  @ApiProperty({ example: 2.15 }) total_fees!: number;
  @ApiProperty({ example: 4.0 }) total_penalties!: number;
  @ApiProperty({ example: 3.0 }) total_profit!: number;
}

export class TransactionsPageDto {
  @ApiProperty({ type: [TransactionDto] }) data!: TransactionDto[];
  @ApiProperty({ type: TransactionsSummaryDto })
  summary!: TransactionsSummaryDto;
}

export class LineupDto {
  @ApiProperty({ example: 1 }) club_id!: number;
  @ApiProperty({
    enum: ['3-1', '2-2', '2-1-1', '1-2-1'],
    nullable: true,
    type: String,
  })
  formation!: string | null;
  @ApiProperty({ example: true, description: 'true quando há os 5 titulares.' })
  complete!: boolean;
  @ApiProperty({ type: [PlayerDto] }) players!: PlayerDto[];
}

export class MatchSideDto {
  @ApiProperty({ example: 1 }) club_id!: number;
  @ApiProperty({ example: 'Águias FC' }) club_name!: string;
  @ApiProperty({ enum: ['3-1', '2-2', '2-1-1', '1-2-1'] }) formation!: string;
  @ApiProperty({ example: 1 }) goals!: number;
}

export class DuelPlayerDto {
  @ApiProperty({ example: 34 }) player_id!: number;
  @ApiProperty({ example: 'Otto Rangel' }) player_name!: string;
  @ApiProperty({ enum: ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] }) position!: string;
  @ApiProperty({ enum: ['APTO', 'MAL_CONDICIONADO'] }) condition!: string;
  @ApiProperty({ example: 'shooting' }) attribute!: string;
  @ApiProperty({
    example: 75,
    description: 'Já com o efeito da condição (RN20).',
  })
  value!: number;
}

export class DuelDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 6 }) order!: number;
  @ApiProperty({ example: 1 }) attacking_club_id!: number;
  @ApiProperty({ type: DuelPlayerDto }) attacker!: DuelPlayerDto;
  @ApiProperty({ type: DuelPlayerDto }) defender!: DuelPlayerDto;
  @ApiProperty({ example: true }) goal!: boolean;
}

export class MatchSummaryDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '2026-11-12T15:00:00-03:00' }) played_at!: string;
  @ApiProperty({ type: MatchSideDto }) home!: MatchSideDto;
  @ApiProperty({ type: MatchSideDto }) away!: MatchSideDto;
  @ApiProperty({ enum: ['MANDANTE', 'VISITANTE', 'EMPATE'] }) result!: string;
}

export class MatchDto extends MatchSummaryDto {
  @ApiProperty({ type: [DuelDto] }) duels!: DuelDto[];
}

export class StandingDto {
  @ApiProperty({ example: 1 }) position!: number;
  @ApiProperty({ example: 2 }) club_id!: number;
  @ApiProperty({ example: 'Delta FC' }) club_name!: string;
  @ApiProperty({ example: 1 }) played!: number;
  @ApiProperty({ example: 1 }) wins!: number;
  @ApiProperty({ example: 0 }) draws!: number;
  @ApiProperty({ example: 0 }) losses!: number;
  @ApiProperty({ example: 2 }) goals_for!: number;
  @ApiProperty({ example: 1 }) goals_against!: number;
  @ApiProperty({ example: 1 }) goal_difference!: number;
  @ApiProperty({ example: 3 }) points!: number;
}
