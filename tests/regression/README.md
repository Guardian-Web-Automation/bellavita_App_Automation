# Regression specs

You author specs here — the skeleton intentionally ships none.

**Convention:** one file per feature area, `*.spec.ts`, importing page objects
from `@screens/*` and utils from `@utils/*`.

**Suggested first target — the golden path** (proves every risky integration
in one flow before you scale to full regression):

    login (email-OTP) -> search (Wizzy) -> PDP -> add-to-cart
      -> WL-01 assert: no line item is ₹0
      -> BellaPoints redeem -> GoKwik webview checkout (sandbox)

**Shape of a spec** (illustrative — not runnable, fill in the flow):

    import { LoginScreen } from '@screens/login.screen.js'
    import { testUsers } from '@data/test-data.js'

    describe('Golden path', () => {
      const login = new LoginScreen()
      it('logs in via email OTP', async () => {
        await login.loginWithEmailOtp(testUsers.primary.email)
        // assert landed on home
      })
    })

Then broaden by module (Phase 2), then add iOS + device matrix (Phase 3).
