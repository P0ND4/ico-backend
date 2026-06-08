import { Module } from '@nestjs/common';
import { CatalogModule } from './http-api/v1/catalog.module';

@Module({
  imports: [CatalogModule],
})
export class CatalogContextModule {}
