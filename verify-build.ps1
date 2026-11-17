$ErrorActionPreference = "Continue"
Set-Location "c:\Users\Gayathri.m\Downloads\Developb\iet-ui-testtaker"
Write-Host "Running TypeScript compiler..."
npx tsc -p tsconfig.build.json --noEmit
$tcExit = $LASTEXITCODE
Write-Host "TypeScript exit code: $tcExit"

if ($tcExit -eq 0) {
    Write-Host "✓ TypeScript compilation succeeded!"
} else {
    Write-Host "✗ TypeScript compilation failed with exit code $tcExit"
}

exit $tcExit
