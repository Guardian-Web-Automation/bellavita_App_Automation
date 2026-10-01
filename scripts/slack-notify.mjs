/**
 * Post the daily Android suite result to Slack as a Block Kit message.
 * Mirrors the BevzillaWellness notification. Reads everything from env so it
 * works both in the GitHub Actions workflow and when run manually.
 *
 * Required: SLACK_WEBHOOK_URL
 * Optional: PASSED, FAILURES, SKIPPED, TESTS, JOB_STATUS (success|failure),
 *           EVENT (schedule|workflow_dispatch|manual), RUN_URL
 *
 *   node scripts/slack-notify.mjs
 */
const s = process.env
const webhook = s.SLACK_WEBHOOK_URL
if (!webhook) {
  console.log('SLACK_WEBHOOK_URL not set — skipping Slack notification.')
  process.exit(0)
}

const tests = Number(s.TESTS || 0)
const failures = Number(s.FAILURES || 0)
const skipped = Number(s.SKIPPED || 0)
const passed = Number(s.PASSED || Math.max(tests - failures - skipped, 0))
const ok = (s.JOB_STATUS ? s.JOB_STATUS === 'success' : true) && failures === 0
const emoji = ok ? '✅' : '❌'
const statusText = ok ? 'PASSED' : 'FAILED'
const color = ok ? '#36a64f' : '#ff0000'
const event = s.EVENT || 'manual'

const blocks = [
  { type: 'header', text: { type: 'plain_text', text: `${emoji} Bellavita App Automation Report` } },
  { type: 'section', fields: [
    { type: 'mrkdwn', text: `*Status:*\n${emoji} ${statusText}` },
    { type: 'mrkdwn', text: `*Triggered By:*\n${event}` }
  ] },
  { type: 'divider' },
  { type: 'section', text: { type: 'mrkdwn', text: '*🤖 Test Results Summary*' } },
  { type: 'section', fields: [
    { type: 'mrkdwn', text: `*📊 Total:*\n${tests}` },
    { type: 'mrkdwn', text: `*✅ Passed:*\n${passed}` }
  ] },
  { type: 'section', fields: [
    { type: 'mrkdwn', text: `*❌ Failed:*\n${failures}` },
    { type: 'mrkdwn', text: `*⚠️ Skipped:*\n${skipped}` }
  ] }
]
if (s.RUN_URL) {
  blocks.push({ type: 'divider' })
  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*📄 Full run & artifacts:*\n<${s.RUN_URL}|Open the run>` } })
}
blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: 'Bellavita Android | Appium + WebdriverIO + TypeScript' }] })

const payload = { attachments: [{ color, blocks }] }

const res = await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
const body = await res.text()
console.log(`Slack POST -> ${res.status} ${body}`)
if (!res.ok) process.exit(1)
