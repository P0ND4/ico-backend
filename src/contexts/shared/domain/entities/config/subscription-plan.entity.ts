import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'con', name: 'subscription_plans' })
export class SubscriptionPlanEntity {
  @PrimaryColumn({ name: 'code' })
  code!: string;

  @Column()
  label!: string;

  @Column({ name: 'price_monthly', type: 'numeric', precision: 10, scale: 2, nullable: true })
  priceMonthly!: number | null;

  @Column({ name: 'price_annual', type: 'numeric', precision: 10, scale: 2, nullable: true })
  priceAnnual!: number | null;

  /** NULL = ilimitado; 0 = deshabilitado */
  @Column({ name: 'max_standard_paths', type: 'integer', nullable: true })
  maxStandardPaths!: number | null;

  /** NULL = ilimitado; 0 = deshabilitado */
  @Column({ name: 'max_deep_paths', type: 'integer', nullable: true })
  maxDeepPaths!: number | null;

  @Column({ name: 'max_chapters', type: 'integer', nullable: true })
  maxChapters!: number | null;

  @Column({ name: 'max_lessons', type: 'integer', nullable: true })
  maxLessons!: number | null;

  /** NULL = ilimitado; 0 = deshabilitado */
  @Column({ name: 'max_tutor_requests', type: 'integer', nullable: true })
  maxTutorRequests!: number | null;

  /** NULL = ilimitado; 0 = deshabilitado */
  @Column({ name: 'max_summary_requests', type: 'integer', nullable: true })
  maxSummaryRequests!: number | null;

  @Column({ name: 'ads_enabled' })
  adsEnabled!: boolean;

  @Column({ name: 'is_default_free', default: false })
  isDefaultFree!: boolean;

  @Column({ name: 'is_unlimited', default: false })
  isUnlimited!: boolean;

  @Column({ name: 'show_in_paywall', default: false })
  showInPaywall!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  /** NULL = cupos de por vida; N = renueva cada N días */
  @Column({ name: 'quota_reset_days', type: 'integer', nullable: true })
  quotaResetDays!: number | null;

  @Column({ name: 'quota_scope', default: 'device' })
  quotaScope!: 'device' | 'user';

  @Column({ name: 'enforce_device_trial_slot', default: false })
  enforceDeviceTrialSlot!: boolean;
}
