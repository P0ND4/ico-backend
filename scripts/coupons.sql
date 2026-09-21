-- ============================================================================
-- Coupons — production DDL
--
-- `synchronize` creates this automatically outside production. There are no
-- TypeORM migrations in this project, so this script MUST be run by hand on the
-- production database BEFORE deploying the coupon feature.
--
-- Every new column is nullable or has a default, so the ALTER is non
-- destructive and safe to run on a live table.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- con.coupons — coupon catalog (created by seed or manual INSERT)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS con.coupons (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  code             varchar(40)  NOT NULL UNIQUE,
  grant_type       varchar(20)  NOT NULL,
  resource         varchar(20)  NULL,
  amount           integer      NULL,
  plan_code        varchar(50)  NULL,
  duration_days    integer      NULL,
  max_redemptions  integer      NULL,
  redeemed_count   integer      NOT NULL DEFAULT 0,
  expires_at       timestamptz  NULL,
  is_active        boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT NOW(),
  updated_at       timestamptz  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_coupons_grant_type
    CHECK (grant_type IN ('quota_bonus', 'vip_access', 'plan_upgrade')),
  CONSTRAINT chk_coupons_resource
    CHECK (resource IS NULL
           OR resource IN ('tutor', 'summary', 'standard_path', 'deep_path')),
  CONSTRAINT chk_coupons_code_upper
    CHECK (code = upper(code)),
  CONSTRAINT chk_coupons_amount_positive
    CHECK (amount IS NULL OR amount > 0),
  CONSTRAINT chk_coupons_duration_positive
    CHECK (duration_days IS NULL OR duration_days > 0),
  CONSTRAINT chk_coupons_max_redemptions_positive
    CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  -- Final safety belt for the max-redemptions race; the conditional UPDATE in
  -- CouponTypeOrmRepository.claimRedemptionSlot is the primary guarantee.
  CONSTRAINT chk_coupons_redeemed_within_limit
    CHECK (max_redemptions IS NULL OR redeemed_count <= max_redemptions)
);

-- ---------------------------------------------------------------------------
-- trn.coupon_redemptions — audit trail; the UNIQUE index blocks double redemption
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trn.coupon_redemptions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       uuid         NOT NULL,
  user_id         uuid         NOT NULL,
  code            varchar(40)  NOT NULL,
  grant_type      varchar(20)  NOT NULL,
  effect_summary  varchar(255) NOT NULL,
  granted_until   timestamptz  NULL,
  redeemed_at     timestamptz  NOT NULL DEFAULT NOW(),
  created_at      timestamptz  NOT NULL DEFAULT NOW(),
  updated_at      timestamptz  NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_coupon_redemptions_coupon
    FOREIGN KEY (coupon_id) REFERENCES con.coupons (id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_redemptions_user
    FOREIGN KEY (user_id) REFERENCES trn.users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_coupon_redemptions_coupon_user
  ON trn.coupon_redemptions (coupon_id, user_id);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
  ON trn.coupon_redemptions (user_id);

-- ---------------------------------------------------------------------------
-- trn.user_quota_bonuses — permanent extra uses; consumed_uses never resets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trn.user_quota_bonuses (
  user_id       uuid        NOT NULL,
  resource      varchar(20) NOT NULL,
  granted_uses  integer     NOT NULL DEFAULT 0,
  consumed_uses integer     NOT NULL DEFAULT 0,

  CONSTRAINT pk_user_quota_bonuses PRIMARY KEY (user_id, resource),
  CONSTRAINT fk_user_quota_bonuses_user
    FOREIGN KEY (user_id) REFERENCES trn.users (id) ON DELETE CASCADE,
  CONSTRAINT chk_user_quota_bonuses_resource
    CHECK (resource IN ('tutor', 'summary', 'standard_path', 'deep_path')),
  CONSTRAINT chk_user_quota_bonuses_consumed
    CHECK (consumed_uses >= 0 AND consumed_uses <= granted_uses)
);

-- ---------------------------------------------------------------------------
-- trn.users — new access columns (all nullable: non destructive)
-- ---------------------------------------------------------------------------
ALTER TABLE trn.users
  ADD COLUMN IF NOT EXISTS vip_expires_at  timestamptz NULL,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS base_plan_code  varchar(50) NULL;

COMMIT;
