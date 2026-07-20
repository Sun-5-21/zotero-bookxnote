$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginDir = Join-Path $Root "plugin"
$DistDir = Join-Path $Root "dist"
$ZipOutput = Join-Path $DistDir "bookxnote-zotero-opener.zip"
$XpiOutput = Join-Path $DistDir "bookxnote-zotero-opener.xpi"

New-Item -ItemType Directory -Force -Path $DistDir | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue $ZipOutput, $XpiOutput

Compress-Archive -Path (Join-Path $PluginDir "*") -DestinationPath $ZipOutput
Move-Item -Force $ZipOutput $XpiOutput
Write-Host "Built: $XpiOutput"
