import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'trn', name: 'user_plan_quotas' })
export class UserPlanQuotaEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'tutor_uses', type: 'int', default: 0 })
  tutorUses!: number;

  @Column({ name: 'summary_uses', type: 'int', default: 0 })
  summaryUses!: number;

  @Column({ name: 'standard_path_uses', type: 'int', default: 0 })
  standardPathUses!: number;

  @Column({ name: 'deep_path_uses', type: 'int', default: 0 })
  deepPathUses!: number;

  @Column({ name: 'period_started_at', type: 'timestamptz', default: () => 'NOW()' })
  periodStartedAt!: Date;
}
