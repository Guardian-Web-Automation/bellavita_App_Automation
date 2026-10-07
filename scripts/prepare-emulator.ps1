$ErrorActionPreference = "Stop"

# Environment variables
$AVD = if ($env:ANDROID_AVD) { $env:ANDROID_AVD } else { "Pixel7_API34" }
$SERIAL = if ($env:ANDROID_SERIAL) { $env:ANDROID_SERIAL } else { "emulator-5554" }
$PKG = if ($env:ANDROID_APP_PACKAGE) { $env:ANDROID_APP_PACKAGE } else { "com.bellavita.shopifyapps" }

# Android SDK
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
$ADB = Join-Path $SDK "platform-tools\adb.exe"

Write-Host "Android SDK: $SDK"
Write-Host "Emulator: $EMU"
Write-Host "ADB: $ADB"
Write-Host "AVD: $AVD"
Write-Host "Serial: $SERIAL"
Write-Host "Package: $PKG"

# Validate Android SDK
if (-not (Test-Path $EMU)) {
    Write-Error "Android emulator not found at: $EMU"
    exit 1
}

if (-not (Test-Path $ADB)) {
    Write-Error "ADB not found at: $ADB"
    exit 1
}

# Add Android tools to PATH
$env:PATH = "$SDK\platform-tools;$SDK\emulator;$env:PATH"

# Check connected device
$devices = & $ADB devices
$deviceOnline = $devices | Select-String "^$SERIAL\s+device$"

if (-not $deviceOnline) {
    Write-Host "No device online - booting AVD '$AVD'..."

    Start-Process `
        -FilePath $EMU `
        -ArgumentList "-avd", $AVD, "-no-boot-anim", "-no-snapshot-save" `
        -WindowStyle Hidden

    Write-Host "Waiting for ADB device..."
    & $ADB -s $SERIAL wait-for-device
}

Write-Host "Waiting for boot to complete..."

$bootComplete = $false

for ($i = 0; $i -lt 100; $i++) {
    try {
        $bootStatus = & $ADB -s $SERIAL shell getprop sys.boot_completed 2>$null
        $bootStatus = $bootStatus.Trim()

        if ($bootStatus -eq "1") {
            $bootComplete = $true
            break
        }
    }
    catch {
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
    & $ADB -s $SERIAL shell pm grant $PKG android.permission.POST_NOTIFICATIONS 2>$null
}
catch {
    Write-Host "Notification permission grant skipped."
}

Write-Host "Launching app to pre-warm the feed..."

try {
    & $ADB -s $SERIAL shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 2>$null
}
catch {
    Write-Host "App launch command returned an error; continuing."
}

# Wait for app to become focused
for ($i = 0; $i -lt 30; $i++) {
    try {
        $focus = & $ADB -s $SERIAL shell dumpsys window 2>$null

        if ($focus -match [regex]::Escape($PKG)) {
            Write-Host "App is in focus."
            break
        }
    }
    catch {
    }

    Start-Sleep -Seconds 2
}

Write-Host "Allowing app 30 seconds to pre-warm..."
Start-Sleep -Seconds 30

Write-Host "Emulator ready."