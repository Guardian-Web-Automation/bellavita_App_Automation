import dotenv from 'dotenv'

dotenv.config()

export const shared: Partial<WebdriverIO.Config> = {
  runner: 'local',
  specs: ['../tests/regression/**/*.spec.ts'],
  exclude: [],

  maxInstances: 1,

  specFileRetries: 1,
  specFileRetriesDeferred: true,
  specFileRetriesDelay: 5,

  // Keep console output clean
  logLevel: 'warn',

  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    ['appium', {
      args: {
        address: process.env.APPIUM_HOST || '127.0.0.1',
        port: Number(process.env.APPIUM_PORT) || 4723,
        relaxedSecurity: true,

        // Reduce Appium console noise
        logLevel: 'error'
      },
      logPath: './reports/'
    }]
  ],

  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: Number(process.env.APPIUM_PORT) || 4723,
  path: '/',

  framework: 'mocha',

  mochaOpts: {
    ui: 'bdd',
    timeout: 180000
  },

  reporters: [
    'spec',

    ['allure', {
      outputDir: './reports/allure-results',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false
    }],

    ['junit', {
      outputDir: './results',
      outputFileFormat(options: { cid: string }) {
        return `junit-${options.cid}.xml`
      }
    }]
  ],

  onPrepare: function () {},

  before: async function () {
    const pkg =
      process.env.ANDROID_APP_PACKAGE ||
      'com.bellavita.shopifyapps'

    try {
      await driver.execute('mobile: shell', {
        command: 'pm',
        args: [
          'grant',
          pkg,
          'android.permission.POST_NOTIFICATIONS'
        ]
      })
    } catch {
      // Permission may already be granted
    }

    const allowSel =
      'android=new UiSelector().resourceIdMatches(".*permission_allow.*button")'

    for (let i = 0; i < 3; i++) {
      let count = 0

      try {
        count = await $$(allowSel).length
      } catch {
        break
      }

      if (count === 0) break

      try {
        await $(allowSel).click()
        await driver.pause(800)
      } catch {
        break
      }
    }
  },

  afterTest: async function (_test, _context, result) {
    if (!result.passed) {
      await browser.takeScreenshot()
    }
  },

  onComplete: function () {}
}