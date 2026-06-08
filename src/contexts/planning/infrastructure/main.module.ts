import { Module } from '@nestjs/common';
import { PlanModule } from './http-api/v1/plan.module';

@Module({
  imports: [PlanModule],
})
export class PlanningModule {}
