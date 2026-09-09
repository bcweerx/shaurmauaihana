param([switch]$Preview)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskNode = Get-Command node -ErrorAction SilentlyContinue
if ($taskNode) {
  $taskNodePath = $taskNode.Source
} else {
  $taskNodePath = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
}
if (-not (Test-Path -LiteralPath $taskNodePath)) { throw 'Install Node.js 24.x first.' }
if (-not (Test-Path -LiteralPath 'node_modules/vite/bin/vite.js')) { throw 'Run pnpm install --frozen-lockfile first.' }
if ($Preview) {
  if (-not (Test-Path -LiteralPath 'dist/index.html')) { throw 'Run pnpm build first.' }
  & $taskNodePath node_modules/vite/bin/vite.js preview
} else {
  & $taskNodePath node_modules/vite/bin/vite.js
}
exit $LASTEXITCODE
