/**
 * ApiSetup — deterministic staging setup/teardown so loyalty + coupon specs
 * aren't flaky (seed BellaPoints balance, create/clear coupons, reset cart).
 *
 * STUB: wire to the staging API. Base URL + token come from .env.
 * This is what makes WL-02 / WL-04 (BellaPoints) cases repeatable.
 */
export class ApiSetup {
  constructor(
    private readonly baseUrl = process.env.STAGING_API_BASE_URL,
    private readonly token = process.env.STAGING_API_TOKEN
  ) {}

  async seedLoyaltyPoints(_email: string, _points: number): Promise<void> {
    // TODO
  }

  async resetCart(_email: string): Promise<void> {
    // TODO
  }
}
