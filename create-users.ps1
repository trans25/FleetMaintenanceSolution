# Create Tenant Admin Users Script
$authApiUrl = "http://localhost:5001/api"

# Login as SystemAdmin
Write-Host "Logging in as SystemAdmin..." -ForegroundColor Cyan
$loginBody = @{
    username = "admin"
    password = "admin"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$authApiUrl/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Login successful" -ForegroundColor Green

# Set authorization header
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# TenantAdmin role ID
$tenantAdminRoleId = 8

# User 1: The Courier Guy Admin
Write-Host "`nCreating user for The Courier Guy..." -ForegroundColor Cyan
$user1 = @{
    tenantId = 1
    username = "admin.courierguy"
    email = "info@thecourierguy.co.za"
    password = "test123"
    firstName = "Admin"
    lastName = "CourierGuy"
    isActive = $true
    roleIds = @($tenantAdminRoleId)
} | ConvertTo-Json

try {
    $createdUser1 = Invoke-RestMethod -Uri "$authApiUrl/User" -Method Post -Body $user1 -Headers $headers
    Write-Host "Created user: $($createdUser1.username)" -ForegroundColor Green
} catch {
    Write-Host "Failed to create user: $_" -ForegroundColor Red
}

# User 2: Aramex Admin
Write-Host "`nCreating user for Aramex..." -ForegroundColor Cyan
$user2 = @{
    tenantId = 2
    username = "admin.aramex"
    email = "customercare@aramex.co.za"
    password = "test123"
    firstName = "Admin"
    lastName = "Aramex"
    isActive = $true
    roleIds = @($tenantAdminRoleId)
} | ConvertTo-Json

try {
    $createdUser2 = Invoke-RestMethod -Uri "$authApiUrl/User" -Method Post -Body $user2 -Headers $headers
    Write-Host "Created user: $($createdUser2.username)" -ForegroundColor Green
} catch {
    Write-Host "Failed to create user: $_" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Green
