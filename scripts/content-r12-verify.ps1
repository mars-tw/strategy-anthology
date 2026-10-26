$ErrorActionPreference = 'Continue'
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if ((Get-Location).Path -ne $repo) { throw 'Wrong repository.' }
$out = Join-Path $repo 'docs/content/r12/verification'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$started = (Get-Date).ToUniversalTime().ToString('o')
npm run verify *> (Join-Path $out 'verify.txt')
$verifyCode = $LASTEXITCODE
$logPath = Join-Path $out 'verify.txt'
$logText = Get-Content -LiteralPath $logPath -Raw
[IO.File]::WriteAllText($logPath, $logText, [System.Text.UTF8Encoding]::new($false))
$result = [ordered]@{status=$(if ($verifyCode -eq 0) {'VERIFIED'} else {'BLOCKED'});verifyExitCode=$verifyCode;startedAt=$started;finishedAt=(Get-Date).ToUniversalTime().ToString('o');buildSHA256=(Get-FileHash -LiteralPath (Join-Path $repo 'dist/game.js') -Algorithm SHA256).Hash.ToLower();styleSHA256=(Get-FileHash -LiteralPath (Join-Path $repo 'dist/style.css') -Algorithm SHA256).Hash.ToLower()}
$result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $out 'verification.json') -Encoding UTF8
Write-Output "$($result.status): npm run verify exit $verifyCode"
exit $verifyCode
