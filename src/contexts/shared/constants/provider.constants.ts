/**
 * Well-known provider UUIDs. These must match the seeded rows in cat.auth_providers.
 * Using deterministic UUIDs (v5 namespace) for known providers.
 */
export const AUTH_PROVIDER_IDS = {
  GOOGLE: '00000000-0000-0000-0000-000000000001',
  APPLE: '00000000-0000-0000-0000-000000000002',
  GUEST: '00000000-0000-0000-0000-000000000003',
} as const;
