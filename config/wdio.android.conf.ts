import { shared } from './wdio.shared.conf.js'

/**
 * Android capabilities, pre-seeded with the exact values proven working
 * against the Pixel7_API34 emulator during Phase 0. Override via .env.
 */
const androidCaps: WebdriverIO.Capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_UDID || 'emulator-5554',
  'appium:udid': process.env.ANDROID_DEVICE_UDID || 'emulator-5554',
  'appium:appPackage': process.env.ANDROID_APP_PACKAGE || 'com.bellavita.shopifyapps',
  'appium:appActivity': process.env.ANDROID_APP_ACTIVITY || 'com.bellavita.shopifyapps.MainActivity',
  'appium:appWaitActivity': '*',
  'appium:noReset': true,
  'appium:newCommandTimeout': 240,
  'appium:autoGrantPermissions': true
  // If ANDROID_APP_PATH is set, install fresh instead of driving the installed app:
  // 'appium:app': process.env.ANDROID_APP_PATH
}

export const config: WebdriverIO.Config = {
  ...shared,
  capabilities: [androidCaps]
}
