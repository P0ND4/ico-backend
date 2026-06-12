import type { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';

export interface ISubscriptionPlanRepository {
  findByCode(code: string): Promise<SubscriptionPlanEntity | null>;
  findAll(): Promise<SubscriptionPlanEntity[]>;
}
