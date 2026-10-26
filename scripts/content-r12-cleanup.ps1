param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if ((Get-Location).Path -ne $repo) { throw 'Run in the named repository root.' }
$receiptPath = Join-Path $repo 'docs/content/r12/cleanup.json'
function Test-SupersededImage([string]$name) {
 if ($name -notmatch '\.(png|jpe?g|webp|webm|mp4)$' -or $name -match '^docs/content/r\d+/art/') { return $false }
 return $name -match '^docs/(content/r(?:[1-9]|10|11)/|evidence/content-r(?:[1-9]|10|11)/|art/(?:compare/after/|r[1-7]/(?:legacy-checks|screens|chapters|motion)/))'
}
if (!$Apply) {
 $files = @()
 foreach ($name in (git ls-files)) {
  if (!(Test-SupersededImage $name)) { continue }
  $target = [IO.Path]::GetFullPath((Join-Path $repo $name))
  if (!$target.StartsWith($repo + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Out of scope: $name" }
  if (Test-Path -LiteralPath $target -PathType Leaf) {
   $files += [ordered]@{path=$name;bytes=(Get-Item -LiteralPath $target).Length;sha256=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower()}
  }
 }
 $releasedBytes = 0L
 foreach ($entry in $files) { $releasedBytes += [long]$entry.bytes }
 $receipt = [ordered]@{status='PREPARED';scope=$repo;count=$files.Count;releasedBytes=$releasedBytes;files=$files;preserved=@('All pre-existing untracked files','All Markdown reports and reviews','All store screenshots','Generated source art and art audit inputs','Historical JSON save fixtures read by tests','docs/evidence/before: original-art comparison input')}
 $receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
 Write-Output "PREPARED: $($files.Count) tracked superseded images, $($receipt.releasedBytes) bytes."
 exit
}
$receipt = Get-Content -LiteralPath $receiptPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($receipt.scope -ne $repo) { throw 'Receipt root differs.' }
$tracked = @(git ls-files)
foreach ($item in $receipt.files) {
 if ($tracked -notcontains $item.path) { throw "Not tracked: $($item.path)" }
 $target = [IO.Path]::GetFullPath((Join-Path $repo $item.path))
 if (!$target.StartsWith($repo + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or !(Test-SupersededImage $item.path)) { throw "Out of scope: $target" }
}
# All resolved targets checked before the first deletion; files only, no recursive deletion.
$removed = 0
foreach ($item in $receipt.files) {
 $target = Join-Path $repo $item.path
 if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target; $removed++ }
}
$receipt.status = 'EXECUTED'
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Write-Output "EXECUTED: $removed files removed from the checked receipt."
