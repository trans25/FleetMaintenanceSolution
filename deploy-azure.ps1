# Fleet Maintenance Solution - Azure Deployment Script

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup = "rg-fleet-maintenance",
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$SqlAdminPassword,
    
    [string]$SqlAdminUser = "fleetadmin",
    [switch]$SkipInfrastructure = $false,
    [switch]$DeployOnly = $false
)

$ErrorActionPreference = "Stop"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " Fleet Maintenance Solution - Azure Deployment" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check Azure CLI
try {
    az --version | Out-Null
} catch {
    Write-Host "ERROR: Azure CLI not found! Install from https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Login check
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in. Please login to Azure..." -ForegroundColor Yellow
    az login
}
Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "Subscription: $($account.name)" -ForegroundColor Green
Write-Host ""

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Resource names
$sqlServerName = "sql-fleet-maintenance-$(Get-Random -Minimum 1000 -Maximum 9999)"
$keyVaultName = "kv-fleet-$(Get-Random -Minimum 1000 -Maximum 9999)"
$appPlanName = "plan-fleet-apis"
$authAppName = "app-fleet-auth-$(Get-Random -Minimum 1000 -Maximum 9999)"
$fleetAppName = "app-fleet-api-$(Get-Random -Minimum 1000 -Maximum 9999)"
$maintenanceAppName = "app-fleet-maintenance-$(Get-Random -Minimum 1000 -Maximum 9999)"
$vehicleAppName = "app-fleet-vehicle-$(Get-Random -Minimum 1000 -Maximum 9999)"
$staticAppName = "stapp-fleet-$(Get-Random -Minimum 1000 -Maximum 9999)"
$appInsightsName = "ai-fleet-maintenance"

if (-not $SkipInfrastructure -and -not $DeployOnly) {
    # Step 1: Create Resource Group
    Write-Host "Creating Resource Group..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location | Out-Null
    Write-Host "Resource Group created: $ResourceGroup" -ForegroundColor Green
    Write-Host ""

    # Step 2: Create SQL Server and Database
    Write-Host "Creating Azure SQL Server..." -ForegroundColor Yellow
    az sql server create `
        --name $sqlServerName `
        --resource-group $ResourceGroup `
        --location $Location `
        --admin-user $SqlAdminUser `
        --admin-password $SqlAdminPassword | Out-Null
    Write-Host "SQL Server created: $sqlServerName" -ForegroundColor Green

    Write-Host "Configuring SQL Server firewall..." -ForegroundColor Yellow
    az sql server firewall-rule create `
        --resource-group $ResourceGroup `
        --server $sqlServerName `
        --name "AllowAzureServices" `
        --start-ip-address "0.0.0.0" `
        --end-ip-address "0.0.0.0" | Out-Null
    Write-Host "Firewall configured." -ForegroundColor Green

    Write-Host "Creating SQL Database..." -ForegroundColor Yellow
    az sql db create `
        --resource-group $ResourceGroup `
        --server $sqlServerName `
        --name "FleetMaintenanceDB" `
        --service-objective "S0" | Out-Null
    Write-Host "Database created: FleetMaintenanceDB" -ForegroundColor Green
    Write-Host ""

    # Step 3: Create Key Vault
    Write-Host "Creating Key Vault..." -ForegroundColor Yellow
    az keyvault create `
        --name $keyVaultName `
        --resource-group $ResourceGroup `
        --location $Location | Out-Null
    Write-Host "Key Vault created: $keyVaultName" -ForegroundColor Green

    # Store secrets
    $connectionString = "Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=FleetMaintenanceDB;Persist Security Info=False;User ID=${SqlAdminUser};Password=${SqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    Write-Host "Storing secrets in Key Vault..." -ForegroundColor Yellow
    az keyvault secret set --vault-name $keyVaultName --name "SqlConnectionString" --value $connectionString | Out-Null
    az keyvault secret set --vault-name $keyVaultName --name "JwtSecretKey" --value $jwtSecret | Out-Null
    Write-Host "Secrets stored successfully." -ForegroundColor Green
    Write-Host ""

    # Step 4: Create App Service Plan
    Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
    az appservice plan create `
        --name $appPlanName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku "B1" `
        --is-linux | Out-Null
    Write-Host "App Service Plan created: $appPlanName" -ForegroundColor Green
    Write-Host ""

    # Step 5: Create App Services
    Write-Host "Creating App Services..." -ForegroundColor Yellow
    
    $apps = @(
        @{Name=$authAppName; DisplayName="Auth API"},
        @{Name=$fleetAppName; DisplayName="Fleet API"},
        @{Name=$maintenanceAppName; DisplayName="Maintenance API"},
        @{Name=$vehicleAppName; DisplayName="Vehicle API"}
    )
    
    foreach ($app in $apps) {
        Write-Host "  Creating $($app.DisplayName)..." -ForegroundColor Cyan
        az webapp create `
            --resource-group $ResourceGroup `
            --plan $appPlanName `
            --name $app.Name `
            --runtime "DOTNET|8.0" | Out-Null
        Write-Host "  Created: $($app.Name)" -ForegroundColor Green
    }
    Write-Host ""

    # Step 6: Create Application Insights
    Write-Host "Creating Application Insights..." -ForegroundColor Yellow
    az monitor app-insights component create `
        --app $appInsightsName `
        --location $Location `
        --resource-group $ResourceGroup `
        --application-type web | Out-Null
    Write-Host "Application Insights created." -ForegroundColor Green
    Write-Host ""

    # Step 7: Create Static Web App
    Write-Host "Creating Static Web App for frontend..." -ForegroundColor Yellow
    az staticwebapp create `
        --name $staticAppName `
        --resource-group $ResourceGroup `
        --location "eastus2" | Out-Null
    Write-Host "Static Web App created: $staticAppName" -ForegroundColor Green
    Write-Host ""

    # Step 8: Configure Managed Identity and Key Vault Access
    Write-Host "Configuring Managed Identity and Key Vault access..." -ForegroundColor Yellow
    foreach ($app in $apps) {
        Write-Host "  Enabling identity for $($app.Name)..." -ForegroundColor Cyan
        az webapp identity assign --resource-group $ResourceGroup --name $app.Name | Out-Null
        
        $principalId = az webapp identity show --resource-group $ResourceGroup --name $app.Name --query principalId -o tsv
        
        az keyvault set-policy `
            --name $keyVaultName `
            --object-id $principalId `
            --secret-permissions get list | Out-Null
        Write-Host "  Configured: $($app.Name)" -ForegroundColor Green
    }
    Write-Host ""

    # Step 9: Configure App Settings
    Write-Host "Configuring App Settings..." -ForegroundColor Yellow
    $kvUri = "https://${keyVaultName}.vault.azure.net"
    
    # Auth API settings
    az webapp config appsettings set `
        --resource-group $ResourceGroup `
        --name $authAppName `
        --settings `
            ConnectionStrings__DefaultConnection="@Microsoft.KeyVault(SecretUri=${kvUri}/secrets/SqlConnectionString/)" `
            JwtSettings__SecretKey="@Microsoft.KeyVault(SecretUri=${kvUri}/secrets/JwtSecretKey/)" `
            JwtSettings__Issuer="FleetMaintenanceAuth" `
            JwtSettings__Audience="FleetMaintenanceApp" `
            JwtSettings__ExpirationMinutes="60" | Out-Null
    
    # Other APIs
    $apiApps = @($fleetAppName, $maintenanceAppName, $vehicleAppName)
    foreach ($apiApp in $apiApps) {
        az webapp config appsettings set `
            --resource-group $ResourceGroup `
            --name $apiApp `
            --settings ConnectionStrings__DefaultConnection="@Microsoft.KeyVault(SecretUri=${kvUri}/secrets/SqlConnectionString/)" | Out-Null
    }
    Write-Host "App Settings configured." -ForegroundColor Green
    Write-Host ""
}

# Step 10: Build and Deploy APIs
Write-Host "Building and deploying APIs..." -ForegroundColor Yellow
Push-Location $rootPath

# Build solution
dotnet build FleetMaintenance.sln --configuration Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Create publish directory
$publishDir = Join-Path $rootPath "publish-azure"
if (Test-Path $publishDir) {
    Remove-Item -Path $publishDir -Recurse -Force
}
New-Item -Path $publishDir -ItemType Directory | Out-Null

# Publish and deploy Auth API
Write-Host "  Deploying Auth.API..." -ForegroundColor Cyan
$authPublish = Join-Path $publishDir "auth"
dotnet publish "Auth.API\Auth.API.csproj" -c Release -o $authPublish
Compress-Archive -Path "$authPublish\*" -DestinationPath "$publishDir\auth.zip" -Force
az webapp deployment source config-zip --resource-group $ResourceGroup --name $authAppName --src "$publishDir\auth.zip" | Out-Null
Write-Host "  Auth.API deployed." -ForegroundColor Green

# Publish and deploy Fleet API
Write-Host "  Deploying Fleet.API..." -ForegroundColor Cyan
$fleetPublish = Join-Path $publishDir "fleet"
dotnet publish "Fleet.API\Fleet.API.csproj" -c Release -o $fleetPublish
Compress-Archive -Path "$fleetPublish\*" -DestinationPath "$publishDir\fleet.zip" -Force
az webapp deployment source config-zip --resource-group $ResourceGroup --name $fleetAppName --src "$publishDir\fleet.zip" | Out-Null
Write-Host "  Fleet.API deployed." -ForegroundColor Green

# Publish and deploy Maintenance API
Write-Host "  Deploying Maintenance.API..." -ForegroundColor Cyan
$maintenancePublish = Join-Path $publishDir "maintenance"
dotnet publish "Maintenance.API\Maintenance.API.csproj" -c Release -o $maintenancePublish
Compress-Archive -Path "$maintenancePublish\*" -DestinationPath "$publishDir\maintenance.zip" -Force
az webapp deployment source config-zip --resource-group $ResourceGroup --name $maintenanceAppName --src "$publishDir\maintenance.zip" | Out-Null
Write-Host "  Maintenance.API deployed." -ForegroundColor Green

# Publish and deploy Vehicle API
Write-Host "  Deploying Vehicle.API..." -ForegroundColor Cyan
$vehiclePublish = Join-Path $publishDir "vehicle"
dotnet publish "Vehicle.API\Vehicle.API.csproj" -c Release -o $vehiclePublish
Compress-Archive -Path "$vehiclePublish\*" -DestinationPath "$publishDir\vehicle.zip" -Force
az webapp deployment source config-zip --resource-group $ResourceGroup --name $vehicleAppName --src "$publishDir\vehicle.zip" | Out-Null
Write-Host "  Vehicle.API deployed." -ForegroundColor Green

Pop-Location
Write-Host ""

# Step 11: Deploy Frontend
Write-Host "Building and deploying frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $rootPath "fleet-management-ui"
Push-Location $frontendPath

# Create production environment file with Azure URLs
$envProduction = @"
REACT_APP_AUTH_API_URL=https://${authAppName}.azurewebsites.net/api
REACT_APP_FLEET_API_URL=https://${fleetAppName}.azurewebsites.net/api
REACT_APP_MAINTENANCE_API_URL=https://${maintenanceAppName}.azurewebsites.net/api
REACT_APP_VEHICLE_API_URL=https://${vehicleAppName}.azurewebsites.net/api
"@
$envProduction | Set-Content ".env.production"

# Build
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Get deployment token
$token = az staticwebapp secrets list --name $staticAppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv

# Deploy (requires SWA CLI)
if (Get-Command swa -ErrorAction SilentlyContinue) {
    swa deploy ./build --deployment-token $token --app-name $staticAppName
    Write-Host "Frontend deployed successfully." -ForegroundColor Green
} else {
    Write-Host "WARNING: SWA CLI not found. Install with: npm install -g @azure/static-web-apps-cli" -ForegroundColor Yellow
    Write-Host "Then run: cd fleet-management-ui && swa deploy ./build --deployment-token $token --app-name $staticAppName" -ForegroundColor Yellow
}

Pop-Location
Write-Host ""

# Summary
Write-Host "===============================================" -ForegroundColor Green
Write-Host " Azure Deployment Completed!                  " -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resource Details:" -ForegroundColor Cyan
Write-Host "  Resource Group:   $ResourceGroup" -ForegroundColor White
Write-Host "  SQL Server:       ${sqlServerName}.database.windows.net" -ForegroundColor White
Write-Host "  Key Vault:        $keyVaultName" -ForegroundColor White
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:         https://${staticAppName}.azurestaticapps.net" -ForegroundColor White
Write-Host "  Auth API:         https://${authAppName}.azurewebsites.net" -ForegroundColor White
Write-Host "  Fleet API:        https://${fleetAppName}.azurewebsites.net" -ForegroundColor White
Write-Host "  Maintenance API:  https://${maintenanceAppName}.azurewebsites.net" -ForegroundColor White
Write-Host "  Vehicle API:      https://${vehicleAppName}.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run database migrations against Azure SQL" -ForegroundColor Yellow
Write-Host "  2. Configure CORS for frontend URL" -ForegroundColor Yellow
Write-Host "  3. Test all endpoints" -ForegroundColor Yellow
Write-Host ""
Write-Host "To delete all resources:" -ForegroundColor Cyan
Write-Host "  az group delete --name $ResourceGroup --yes" -ForegroundColor Gray
Write-Host ""
