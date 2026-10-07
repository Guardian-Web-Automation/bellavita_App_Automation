$ErrorActionPreference = "Stop"

# Environment variables with defaults
$AVD = if ($env:ANDROID_AVD) { $env:ANDROID_AVD } else { "Pixel7_API34" }
$SERIAL = if ($env:ANDROID_SERIAL) { $env:ANDROID_SERIAL } else { "emulator-5554" }
$PKG = if ($env:ANDROID_APP_PACKAGE) { $env:ANDROID_APP_PACKAGE } else { "com.bellavita.shopifyapps" }

# Locate Android SDK
if ($env:ANDROID_SDK_ROOT) {
    $SDK = $env:ANDROID_SDK_ROOT
}
elseif ($env:ANDROID_HOME) {
    $SDK = $env:ANDROID_HOME
}
else {
    $SDK = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

$EMU = Join-Path $SDK "emulator\emulator.exe"

if (-not (Test-Path $EMU)) {
    Write-Error "Android emulator not found at: $EMU"
    exit 1
}

Write-Host "Android SDK: $SDK"
Write-Host "Emulator: $EMU"
Write-Host "AVD: $AVD"
Write-Host "Serial: $SERIAL"
Write-Host "Package: $PKG"

# Check whether the requested device is already online
$devices = adb devices
$deviceOnline = $devices | Select-String "^$SERIAL\s+device$"

if (-not $deviceOnline) {
    Write-Host "No device online - booting AVD '$AVD'..."

    Start-Process `
        -FilePath $EMU `
        -ArgumentList "-avd", $AVD, "-no-boot-anim", "-no-snapshot-save" `
        -WindowStyle Hidden

    Write-Host "Waiting for ADB device..."
    adb -s $SERIAL wait-for-device
}

Write-Host "Waiting for boot to complete..."

$bootComplete = $false

for ($i = 0; $i -lt 100; $i++) {
    try {
        $bootStatus = adb -s $SERIAL shell getprop sys.boot_completed 2>$null
        $bootStatus = $bootStatus.Trim()

        if ($bootStatus -eq "1") {
            $bootComplete = $true
            break
        }
    }
    catch {
        # Device may not be ready yet
    }

    Start-Sleep -Seconds 3
}

if (-not $bootComplete) {
    Write-Error "Android emulator did not finish booting within the expected time."
    exit 1
}

Write-Host "Booted."

# Grant notification permission
try {
    adb -s $SERIAL shell pm grant $PKG android.permission.POST_NOTIFICATIONS 2>$null
}
catch {
    Write-Host "Notification permission grant skipped."
}

Write-Host "Launching app to pre-warm the feed..."

try {
    adb -s $SERIAL shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 2>$null
}
catch {
    Write-Host "App launch command returned an error; continuing."
}

# Wait for app to become the focused activity
for ($i = 0; $i -lt 30; $i++) {
    try {
        $focus = adb -s $SERIAL shell dumpsys window 2>$null

        if ($focus -match [regex]::Escape($PKG)) {
            Write-Host "App is in focus."
            break
        }
    }
    catch {
        # Continue waiting
    }

    Start-Sleep -Seconds 2
}

Write-Host "Allowing app 30 seconds to pre-warm..."
Start-Sleep -Seconds 30

Write-Host "Emulator ready."