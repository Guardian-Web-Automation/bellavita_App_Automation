#!/usr/bin/env bash
# Prepare the local Android emulator for a suite run:
#   - boot the AVD if no device is online
#   - wait for full boot
#   - grant the runtime notifications permission (fresh installs prompt for it)
#   - launch + pre-warm the app so the feed is rendered before tests start
#
# Env overrides: ANDROID_AVD (default Pixel7_API34), ANDROID_SERIAL
# (default emulator-5554), ANDROID_APP_PACKAGE (default com.bellavita.shopifyapps).
set -u

AVD="${ANDROID_AVD:-Pixel7_API34}"
SERIAL="${ANDROID_SERIAL:-emulator-5554}"
PKG="${ANDROID_APP_PACKAGE:-com.bellavita.shopifyapps}"

# Locate the emulator binary.
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}}"
EMU="$SDK/emulator/emulator"
[ -x "$EMU" ] || [ -f "$EMU.exe" ] || EMU="$(command -v emulator || true)"

online() { adb devices | grep -qw "device"; }

if ! online; then
  echo "No device online — booting AVD '$AVD'…"
  # Detach so the emulator keeps running after this script returns.
  ( "$EMU" -avd "$AVD" -no-boot-anim -no-snapshot-save >/dev/null 2>&1 & )
  adb wait-for-device
fi

echo "Waiting for boot to complete…"
until [ "$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 3
done
echo "Booted."

adb -s "$SERIAL" shell pm grant "$PKG" android.permission.POST_NOTIFICATIONS 2>/dev/null || true

echo "Launching app to pre-warm the feed…"
adb -s "$SERIAL" shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
for _ in $(seq 1 30); do
  adb -s "$SERIAL" shell dumpsys window 2>/dev/null | grep -q "mCurrentFocus=.*${PKG}" && break
  sleep 2
done
sleep 30
echo "Emulator ready."
