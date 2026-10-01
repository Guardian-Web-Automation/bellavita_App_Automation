/**
 * GmailOtp — fetch the latest email-OTP for a test account via the Gmail API.
 *
 * STUB / PORT TARGET: bring over the working implementation from the
 * Playwright web framework's Gmail OTP utility. The email-OTP flow is the same;
 * only the caller (a mobile page object) differs. Credentials come from .env.
 */
export class GmailOtp {
  constructor(
    private readonly user = process.env.GMAIL_OTP_USER,
    private readonly clientId = process.env.GMAIL_OTP_CLIENT_ID,
    private readonly clientSecret = process.env.GMAIL_OTP_CLIENT_SECRET,
    private readonly refreshToken = process.env.GMAIL_OTP_REFRESH_TOKEN
  ) {}

  /**
   * Poll the inbox for the most recent OTP addressed to `email` and return
   * the numeric code. Port the real logic (auth, search query, regex extract,
   * polling window) from the web framework.
   */
  async fetchLatestOtp(_email: string, _timeoutMs = 60000): Promise<string> {
    // TODO: port from web framework Gmail OTP utility
    throw new Error('GmailOtp.fetchLatestOtp not implemented — port from web framework')
  }
}
