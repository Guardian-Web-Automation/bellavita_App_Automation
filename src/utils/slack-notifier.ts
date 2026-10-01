/**
 * SlackNotifier — post run start/summary to Slack via Block Kit.
 *
 * STUB / PORT TARGET: reuse the Block Kit payload builder from the web
 * framework. Called from the WDIO onPrepare / onComplete hooks. Webhook +
 * channel come from .env.
 */
export class SlackNotifier {
  constructor(
    private readonly webhookUrl = process.env.SLACK_WEBHOOK_URL,
    private readonly channel = process.env.SLACK_CHANNEL
  ) {}

  async postRunStarted(_meta: { platform: string; suite?: string }): Promise<void> {
    // TODO: port Block Kit payload from web framework
  }

  async postRunSummary(_summary: {
    passed: number
    failed: number
    skipped: number
    reportUrl?: string
  }): Promise<void> {
    // TODO: port Block Kit payload from web framework
  }
}
