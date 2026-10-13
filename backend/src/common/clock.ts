import { Injectable } from '@nestjs/common';

/** Fonte do "agora" do servidor: as regras de data usam o instante exato da operação. */
@Injectable()
export class Clock {
  now(): Date {
    return new Date();
  }
}
