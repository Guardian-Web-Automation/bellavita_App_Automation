import { BaseScreen } from './base.screen.js'
// import { GmailOtp } from '@utils/gmail-otp.js'

/**
 * LoginScreen — email-OTP login. The Gmail-OTP utility ports from the web
 * framework (see src/utils/gmail-otp.ts). STUB: confirm real testIDs.
 */
export class LoginScreen extends BaseScreen {
  private readonly emailInput = '~login-email-input'   // TODO: confirm testID
  private readonly sendOtpButton = '~login-send-otp'    // TODO
  private readonly otpInput = '~login-otp-input'         // TODO
  private readonly verifyButton = '~login-verify'        // TODO

  async isLoaded(): Promise<boolean> {
    return this.isDisplayed(this.emailInput)
  }

  async requestOtp(_email: string): Promise<void> {
    // TODO: type email, tap send
  }

  async submitOtp(_code: string): Promise<void> {
    // TODO: type otp, tap verify
  }

  /** Full email-OTP flow: request, fetch code via Gmail util, submit. */
  async loginWithEmailOtp(_email: string): Promise<void> {
    // TODO:
    // await this.requestOtp(email)
    // const code = await new GmailOtp().fetchLatestOtp(email)
    // await this.submitOtp(code)
  }
}
