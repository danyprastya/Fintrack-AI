# FinTrack AI — Telegram Webhook Setup Script
# Run this ONCE after deploying to Vercel (or after changing ngrok URL)
#
# Usage:
#   .\scripts\setup-webhook.ps1 https://your-app.vercel.app
#   .\scripts\setup-webhook.ps1 https://xxxx.ngrok-free.dev

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BaseUrl
)

$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " FinTrack AI — Telegram Bot Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Step 1: Call the setup endpoint
Write-Host "[1/3] Setting up bot (commands, description, webhook)..." -ForegroundColor Green
try {
    $setupUrl = "$BaseUrl/api/bot/setup"
    $body = @{ webhookUrl = "$BaseUrl/api/bot/webhook" } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri $setupUrl -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
    
    if ($result.success) {
        Write-Host "  OK Bot setup completed!" -ForegroundColor Green
        if ($result.results.webhookUrl) {
            Write-Host "  Webhook: $($result.results.webhookUrl)" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  WARN Setup returned unexpected result" -ForegroundColor Yellow
        $result | ConvertTo-Json -Depth 5 | Write-Host
    }
}
catch {
    Write-Host "  FAIL Setup endpoint error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Falling back to direct Telegram API..." -ForegroundColor Yellow
    
    # Fallback: Set webhook directly via Telegram API
    $envFile = Join-Path $PSScriptRoot ".." ".env.local"
    if (Test-Path $envFile) {
        $token = (Get-Content $envFile | Where-Object { $_ -match "^TELEGRAM_BOT_TOKEN=" }) -replace "^TELEGRAM_BOT_TOKEN=", ""
        if ($token) {
            try {
                $webhookBody = @{
                    url                  = "$BaseUrl/api/bot/webhook"
                    allowed_updates      = @("message")
                    drop_pending_updates = $true
                } | ConvertTo-Json
                
                $webhookResult = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method POST -ContentType "application/json" -Body $webhookBody
                if ($webhookResult.ok) {
                    Write-Host "  OK Webhook set via Telegram API!" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "  FAIL Telegram API error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# Step 2: Verify webhook
Write-Host ""
Write-Host "[2/3] Verifying webhook..." -ForegroundColor Green
try {
    $envFile = Join-Path $PSScriptRoot ".." ".env.local"
    $token = ""
    if (Test-Path $envFile) {
        $token = (Get-Content $envFile | Where-Object { $_ -match "^TELEGRAM_BOT_TOKEN=" }) -replace "^TELEGRAM_BOT_TOKEN=", ""
    }
    
    if ($token) {
        $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo"
        if ($info.ok -and $info.result.url -like "*$BaseUrl*") {
            Write-Host "  OK Webhook verified: $($info.result.url)" -ForegroundColor Green
            Write-Host "  Pending updates: $($info.result.pending_update_count)" -ForegroundColor Gray
            if ($info.result.last_error_message) {
                Write-Host "  WARN Last error: $($info.result.last_error_message)" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  WARN Webhook URL mismatch!" -ForegroundColor Yellow
            Write-Host "  Expected: $BaseUrl/api/bot/webhook" -ForegroundColor Gray
            Write-Host "  Got:      $($info.result.url)" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  SKIP Could not read bot token from .env.local" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  FAIL Verify error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test endpoint reachability
Write-Host ""
Write-Host "[3/3] Testing endpoint reachability..." -ForegroundColor Green
try {
    $headers = @{ "ngrok-skip-browser-warning" = "true" }
    $testResult = Invoke-RestMethod -Uri "$BaseUrl/api/bot/webhook" -Method GET -Headers $headers -TimeoutSec 10
    if ($testResult.status) {
        Write-Host "  OK Endpoint reachable: $($testResult.status)" -ForegroundColor Green
    }
}
catch {
    Write-Host "  FAIL Endpoint not reachable: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure your app is running and accessible." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Setup complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your bot: Open Telegram -> @Fina_Tracker_1_Bot -> /start" -ForegroundColor White
Write-Host ""
