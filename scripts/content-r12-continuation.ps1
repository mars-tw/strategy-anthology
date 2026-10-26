# Run every command after the missing external-source audit, without changing verify or its assertions.
$ErrorActionPreference = 'Continue'
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$out = 'docs/content/r12/verification'
$commands = @('scripts/art-audit-r7.mjs','scripts/content-r1-e2e.mjs','scripts/content-r2-e2e.mjs','scripts/content-r3-e2e.mjs','scripts/content-r4-e2e.mjs','scripts/content-r5-e2e.mjs','scripts/content-r6-e2e.mjs','scripts/content-r7-e2e.mjs','scripts/content-r8-e2e.mjs','scripts/content-r9-e2e.mjs','scripts/content-r12-e2e.mjs')
$results = @()
foreach ($script in $commands) {
 node $script *> (Join-Path $out (($script.Split('/')[-1]) + '.txt'))
 $code = $LASTEXITCODE
 $results += [ordered]@{command="node $script";exitCode=$code}
 Write-Output "$script exit $code"
 if ($code -ne 0) { break }
}
$allPassed = $results.Count -eq $commands.Count -and @($results | Where-Object { $_.exitCode -ne 0 }).Count -eq 0
[ordered]@{status=$(if ($allPassed) {'VERIFIED'} else {'BLOCKED'});fullVerifyStatus='BLOCKED';blocker='Original sibling tower-defense and village-siege repositories absent; audit.mjs was preserved and failed. Remaining tests are independent, not a green full verify.';commands=$results} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $out 'continuation.json') -Encoding UTF8
if (!$allPassed) { exit 1 }
