import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from 'src/contexts/shared/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return { status: 'ok' };
  }
}
