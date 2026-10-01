import { BaseScreen } from './base.screen.js'

/**
 * LoyaltyScreen — BellaPoints redemption.
 *
 * WATCH-LIST touchpoints:
 *   WL-02 — guest-checkout redemption bypass
 *   WL-04 — redeemed points not returned on cancellation
 * Seed points deterministically via src/helpers/api-setup.ts before specs run.
 * STUB: confirm real testIDs.
 */
export class LoyaltyScreen extends BaseScreen {
  private readonly pointsBalance = '~bellapoints-balance'    // TODO
  private readonly redeemToggle = '~bellapoints-redeem'      // TODO
  private readonly discountApplied = '~bellapoints-discount' // TODO

  async getBalance(): Promise<string> {
    return this.getText(this.pointsBalance)
  }

  async redeemPoints(): Promise<void> {
    // TODO: toggle redeem, confirm discount applied
  }
}
