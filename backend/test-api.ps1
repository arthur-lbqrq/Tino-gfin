# Script de teste rápido da API Tino.
# Uso: .\test-api.ps1 -Email "seu@email.com" -Password "123456"

param(
    [Parameter(Mandatory = $true)]
    [string]$Email,

    [Parameter(Mandatory = $true)]
    [string]$Password,

    [string]$BaseUrl = "http://localhost:3333"
)

Write-Host "`n== Login ==" -ForegroundColor Cyan
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json

try {
    $auth = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Logado como $($auth.user.name) ($($auth.user.email))" -ForegroundColor Green
} catch {
    Write-Host "Erro no login. Verifique email/senha ou se a API está rodando." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

$headers = @{ Authorization = "Bearer $($auth.token)" }

Write-Host "`n== Categorias ==" -ForegroundColor Cyan
$categories = Invoke-RestMethod -Uri "$BaseUrl/categories" -Headers $headers
$categories | Select-Object name, type, isDefault | Format-Table

Write-Host "`n== Transações ==" -ForegroundColor Cyan
$transactions = Invoke-RestMethod -Uri "$BaseUrl/transactions" -Headers $headers
Write-Host "Total de transações: $($transactions.Count)"
$transactions | Select-Object date, type, amount, description | Format-Table

Write-Host "`n== Dashboard: Resumo ==" -ForegroundColor Cyan
$summary = Invoke-RestMethod -Uri "$BaseUrl/dashboard/summary" -Headers $headers
$summary | Format-List

Write-Host "`n== Dashboard: Fluxo de Caixa (6 meses) ==" -ForegroundColor Cyan
$cashflow = Invoke-RestMethod -Uri "$BaseUrl/dashboard/cashflow" -Headers $headers
$cashflow | Format-Table

Write-Host "`n== Insights ==" -ForegroundColor Cyan
$insights = Invoke-RestMethod -Uri "$BaseUrl/insights" -Headers $headers
if ($insights.Count -eq 0) {
    Write-Host "Nenhum insight gerado ainda (precisa de mais histórico de dados)." -ForegroundColor Yellow
} else {
    foreach ($insight in $insights) {
        $color = switch ($insight.severity) {
            "critical" { "Red" }
            "warning" { "Yellow" }
            default { "White" }
        }
        Write-Host "[$($insight.severity.ToUpper())] $($insight.message)" -ForegroundColor $color
    }
}

Write-Host "`nTeste concluído.`n" -ForegroundColor Cyan
