import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';
import type { ISubscriptionPlanRepository } from 'src/contexts/shared/domain/repositories/config/subscription-plan.repository.interface';

@Injectable()
export class SubscriptionPlanTypeOrmRepository implements ISubscriptionPlanRepository {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly repo: Repository<SubscriptionPlanEntity>,
  ) {}

  findByCode(code: string): Promise<SubscriptionPlanEntity | null> {
    return this.repo.findOne({ where: { code } });
  }

  findAll(): Promise<SubscriptionPlanEntity[]> {
    return this.repo.find({ order: { code: 'ASC' } });
  }
}
