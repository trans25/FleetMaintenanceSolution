# Create Tenant Admin Users Script

# Base API URL
$authApiUrl = "http://localhost:5001/api"

# Login as SystemAdmin to get token (assuming you have admin/admin credentials)
Write-Host "Logging in as SystemAdmin..." -ForegroundColor Cyan
$loginBody = @{
    username = "admin"
    password = "admin"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$authApiUrl/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}

# Set authorization header
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# TenantAdmin role ID (already created in database)
$tenantAdminRoleId = 8
Write-Host "Using TenantAdmin Role ID: $tenantAdminRoleId" -ForegroundColor Green

# User 1: The Courier Guy Admin
Write-Host "`nCreating user for The Courier Guy (Pty) Ltd..." -ForegroundColor Cyan
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
    Write-Host "✓ Created user: $($createdUser1.username) (ID: $($createdUser1.id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create user: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

# User 2: Aramex Admin
Write-Host "`nCreating user for Aramex South Africa..." -ForegroundColor Cyan
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
    Write-Host "✓ Created user: $($createdUser2.username) (ID: $($createdUser2.id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create user: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Tenant Admin users created successfully!" -ForegroundColor Green
Write-Host "Username: admin.courierguy | Password: test123 | Tenant: The Courier Guy" -ForegroundColor White
Write-Host "Username: admin.aramex | Password: test123 | Tenant: Aramex South Africa" -ForegroundColor White

