import { shared } from './wdio.shared.conf.js'

/**
 * iOS capabilities — PLACEHOLDER for Phase 3.
 * iOS needs macOS + Xcode to build/run and the xcuitest driver installed.
 * Fill in once you move to the device farm; deferred per the plan.
 */
const iosCaps: WebdriverIO.Capabilities = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone 15',
  'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '17.0',
  'appium:bundleId': process.env.IOS_BUNDLE_ID || 'com.bellavita.shopifyapps',
  'appium:noReset': true,
  'appium:newCommandTimeout': 240
  // 'appium:app': process.env.IOS_APP_PATH // path to .app / .ipa
}

export const config: WebdriverIO.Config = {
  ...shared,
  capabilities: [iosCaps]
}
