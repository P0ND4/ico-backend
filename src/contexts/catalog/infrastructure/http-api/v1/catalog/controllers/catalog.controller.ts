import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CATALOG_USE_CASE } from 'src/contexts/catalog/domain/contracts/i-catalog.use-case';
import type { ICatalogUseCase } from 'src/contexts/catalog/domain/contracts/i-catalog.use-case';

@ApiTags('Catalog')
@ApiBearerAuth('access-token')
@Controller('catalog')
export class CatalogController {
  constructor(
    @Inject(CATALOG_USE_CASE)
    private readonly catalogUseCase: ICatalogUseCase,
  ) {}

  @Get('tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all tags' })
  getTags() {
    return this.catalogUseCase.listTags();
  }

  @Get('xp-levels')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all XP levels' })
  getXpLevels() {
    return this.catalogUseCase.listXpLevels();
  }

  @Get('subscription-plans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscription plans' })
  getSubscriptionPlans() {
    return this.catalogUseCase.listSubscriptionPlans();
  }
}
