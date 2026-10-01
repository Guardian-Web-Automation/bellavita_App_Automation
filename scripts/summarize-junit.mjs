/**
 * Sum pass/fail/skip across all JUnit XML files WDIO writes under ./results/
 * (one per worker). Prints a summary and, when running in GitHub Actions,
 * appends tests/failures/skipped/passed to $GITHUB_OUTPUT for later steps.
 *
 *   node scripts/summarize-junit.mjs
 */
import { readdirSync, readFileSync, appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'results'
let tests = 0
let failures = 0
let skipped = 0

if (existsSync(dir)) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.xml'))) {
    const xml = readFileSync(join(dir, file), 'utf8')
    // Sum every <testsuite ...> element's attributes (a file may hold several).
    for (const tag of xml.match(/<testsuite\b[^>]*>/g) || []) {
      const num = (attr) => {
        const m = new RegExp(`\\b${attr}="(\\d+)"`).exec(tag)
        return m ? parseInt(m[1], 10) : 0
      }
      tests += num('tests')
      failures += num('failures') + num('errors')
      skipped += num('skipped')
    }
  }
}

const passed = Math.max(tests - failures - skipped, 0)
console.log(`JUnit summary — total:${tests} passed:${passed} failed:${failures} skipped:${skipped}`)

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `tests=${tests}\nfailures=${failures}\nskipped=${skipped}\npassed=${passed}\n`
  )
}
