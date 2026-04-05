# Fleet Maintenance Solution - Azure Deployment Guide

## Architecture Overview

**Azure Services Used:**
- Azure App Services (4 instances for APIs)
- Azure SQL Database
- Azure Static Web Apps or Azure App Service (Frontend)
- Azure Key Vault (for secrets)
- Application Insights (monitoring)

## Prerequisites

- Azure Subscription
- Azure CLI installed: `az --version`
- Visual Studio or VS Code with Azure extensions
- Git repository (GitHub/Azure DevOps)

## Step 1: Azure CLI Setup

```powershell
# Login to Azure
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create Resource Group
az group create --name "rg-fleet-maintenance" --location "eastus"
```

## Step 2: Create Azure SQL Database

```powershell
# Create SQL Server
az sql server create `
  --name "sql-fleet-maintenance" `
  --resource-group "rg-fleet-maintenance" `
  --location "eastus" `
  --admin-user "fleetadmin" `
  --admin-password "YOUR_STRONG_PASSWORD_HERE"

# Configure firewall (allow Azure services)
az sql server firewall-rule create `
  --resource-group "rg-fleet-maintenance" `
  --server "sql-fleet-maintenance" `
  --name "AllowAzureServices" `
  --start-ip-address "0.0.0.0" `
  --end-ip-address "0.0.0.0"

# Create database
az sql db create `
  --resource-group "rg-fleet-maintenance" `
  --server "sql-fleet-maintenance" `
  --name "FleetMaintenanceDB" `
  --service-objective "S0" `
  --backup-storage-redundancy "Local"
```

**Connection String:**
```
Server=tcp:sql-fleet-maintenance.database.windows.net,1433;Initial Catalog=FleetMaintenanceDB;Persist Security Info=False;User ID=fleetadmin;Password=YOUR_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

## Step 3: Create Azure Key Vault

```powershell
# Create Key Vault
az keyvault create `
  --name "kv-fleet-maintenance" `
  --resource-group "rg-fleet-maintenance" `
  --location "eastus"

# Store secrets
az keyvault secret set --vault-name "kv-fleet-maintenance" --name "SqlConnectionString" --value "YOUR_CONNECTION_STRING"
az keyvault secret set --vault-name "kv-fleet-maintenance" --name "JwtSecretKey" --value "YOUR_JWT_SECRET_KEY_32_CHARS_MINIMUM"
```

## Step 4: Create App Service Plans

```powershell
# Create App Service Plan for APIs
az appservice plan create `
  --name "plan-fleet-apis" `
  --resource-group "rg-fleet-maintenance" `
  --sku "B1" `
  --is-linux

# Create App Service Plan for Frontend (optional if using Static Web Apps)
az appservice plan create `
  --name "plan-fleet-frontend" `
  --resource-group "rg-fleet-maintenance" `
  --sku "B1" `
  --is-linux
```

## Step 5: Create App Services for APIs

```powershell
# Auth API
az webapp create `
  --resource-group "rg-fleet-maintenance" `
  --plan "plan-fleet-apis" `
  --name "app-fleet-auth" `
  --runtime "DOTNET|8.0"

# Fleet API
az webapp create `
  --resource-group "rg-fleet-maintenance" `
  --plan "plan-fleet-apis" `
  --name "app-fleet-api" `
  --runtime "DOTNET|8.0"

# Maintenance API
az webapp create `
  --resource-group "rg-fleet-maintenance" `
  --plan "plan-fleet-apis" `
  --name "app-fleet-maintenance" `
  --runtime "DOTNET|8.0"

# Vehicle API
az webapp create `
  --resource-group "rg-fleet-maintenance" `
  --plan "plan-fleet-apis" `
  --name "app-fleet-vehicle" `
  --runtime "DOTNET|8.0"
```

## Step 6: Configure App Settings

```powershell
# Auth API Configuration
az webapp config appsettings set `
  --resource-group "rg-fleet-maintenance" `
  --name "app-fleet-auth" `
  --settings `
    ConnectionStrings__DefaultConnection="@Microsoft.KeyVault(SecretUri=https://kv-fleet-maintenance.vault.azure.net/secrets/SqlConnectionString/)" `
    JwtSettings__SecretKey="@Microsoft.KeyVault(SecretUri=https://kv-fleet-maintenance.vault.azure.net/secrets/JwtSecretKey/)" `
    JwtSettings__Issuer="FleetMaintenanceAuth" `
    JwtSettings__Audience="FleetMaintenanceApp" `
    JwtSettings__ExpirationMinutes="60"

# Repeat for other APIs with same connection string
$apis = @("app-fleet-api", "app-fleet-maintenance", "app-fleet-vehicle")
foreach ($api in $apis) {
    az webapp config appsettings set `
      --resource-group "rg-fleet-maintenance" `
      --name $api `
      --settings `
        ConnectionStrings__DefaultConnection="@Microsoft.KeyVault(SecretUri=https://kv-fleet-maintenance.vault.azure.net/secrets/SqlConnectionString/)"
}
```

## Step 7: Enable Managed Identity and Key Vault Access

```powershell
# Enable Managed Identity for each app
$apps = @("app-fleet-auth", "app-fleet-api", "app-fleet-maintenance", "app-fleet-vehicle")
foreach ($app in $apps) {
    az webapp identity assign `
      --resource-group "rg-fleet-maintenance" `
      --name $app
    
    # Get the principal ID
    $principalId = az webapp identity show --resource-group "rg-fleet-maintenance" --name $app --query principalId -o tsv
    
    # Grant access to Key Vault
    az keyvault set-policy `
      --name "kv-fleet-maintenance" `
      --object-id $principalId `
      --secret-permissions get list
}
```

## Step 8: Configure CORS for APIs

```powershell
# Configure CORS for each API
$apps = @("app-fleet-auth", "app-fleet-api", "app-fleet-maintenance", "app-fleet-vehicle")
foreach ($app in $apps) {
    az webapp cors add `
      --resource-group "rg-fleet-maintenance" `
      --name $app `
      --allowed-origins "https://YOUR_FRONTEND_URL"
}
```

## Step 9: Deploy APIs Using Azure CLI

```powershell
# Navigate to solution directory
cd C:\Users\EliasMashia\Documents\Project\Fleet\FleetMaintenanceSolution

# Auth API
dotnet publish Auth.API/Auth.API.csproj -c Release -o ./publish/auth
Compress-Archive -Path ./publish/auth/* -DestinationPath ./auth.zip -Force
az webapp deployment source config-zip `
  --resource-group "rg-fleet-maintenance" `
  --name "app-fleet-auth" `
  --src "./auth.zip"

# Fleet API
dotnet publish Fleet.API/Fleet.API.csproj -c Release -o ./publish/fleet
Compress-Archive -Path ./publish/fleet/* -DestinationPath ./fleet.zip -Force
az webapp deployment source config-zip `
  --resource-group "rg-fleet-maintenance" `
  --name "app-fleet-api" `
  --src "./fleet.zip"

# Maintenance API
dotnet publish Maintenance.API/Maintenance.API.csproj -c Release -o ./publish/maintenance
Compress-Archive -Path ./publish/maintenance/* -DestinationPath ./maintenance.zip -Force
az webapp deployment source config-zip `
  --resource-group "rg-fleet-maintenance" `
  --name "app-fleet-maintenance" `
  --src "./maintenance.zip"

# Vehicle API
dotnet publish Vehicle.API/Vehicle.API.csproj -c Release -o ./publish/vehicle
Compress-Archive -Path ./publish/vehicle/* -DestinationPath ./vehicle.zip -Force
az webapp deployment source config-zip `
  --resource-group "rg-fleet-maintenance" `
  --name "app-fleet-vehicle" `
  --src "./vehicle.zip"
```

## Step 10: Deploy Frontend to Azure Static Web Apps

```powershell
# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Create Static Web App
az staticwebapp create `
  --name "stapp-fleet-frontend" `
  --resource-group "rg-fleet-maintenance" `
  --location "eastus2" `
  --sku "Free"

# Get deployment token
$token = az staticwebapp secrets list `
  --name "stapp-fleet-frontend" `
  --resource-group "rg-fleet-maintenance" `
  --query "properties.apiKey" -o tsv

# Update frontend API URLs
# Edit fleet-management-ui/src/services/api.js
```

**Create production environment file: fleet-management-ui/.env.production**
```
REACT_APP_AUTH_API_URL=https://app-fleet-auth.azurewebsites.net/api
REACT_APP_FLEET_API_URL=https://app-fleet-api.azurewebsites.net/api
REACT_APP_MAINTENANCE_API_URL=https://app-fleet-maintenance.azurewebsites.net/api
REACT_APP_VEHICLE_API_URL=https://app-fleet-vehicle.azurewebsites.net/api
```

```powershell
# Build and deploy
cd fleet-management-ui
npm run build

# Deploy using SWA CLI
swa deploy ./build `
  --deployment-token $token `
  --app-name "stapp-fleet-frontend"
```

## Step 11: Configure Database (Run Migrations)

Option 1: From local machine with Azure SQL access
```powershell
# Update connection string temporarily
$env:ConnectionStrings__DefaultConnection = "YOUR_AZURE_SQL_CONNECTION_STRING"

# Run migrations
cd Vehicle.API
dotnet ef database update
```

Option 2: Use Azure SQL Query Editor
- Open Azure Portal → SQL Database → Query Editor
- Run migration scripts manually

## Step 12: Configure Application Insights

```powershell
# Create Application Insights
az monitor app-insights component create `
  --app "ai-fleet-maintenance" `
  --location "eastus" `
  --resource-group "rg-fleet-maintenance" `
  --application-type web

# Get instrumentation key
$instrumentationKey = az monitor app-insights component show `
  --app "ai-fleet-maintenance" `
  --resource-group "rg-fleet-maintenance" `
  --query instrumentationKey -o tsv

# Configure each API
$apps = @("app-fleet-auth", "app-fleet-api", "app-fleet-maintenance", "app-fleet-vehicle")
foreach ($app in $apps) {
    az webapp config appsettings set `
      --resource-group "rg-fleet-maintenance" `
      --name $app `
      --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$instrumentationKey"
}
```

## Step 13: Access Your Application

**URLs:**
- Frontend: `https://stapp-fleet-frontend.azurestaticapps.net`
- Auth API: `https://app-fleet-auth.azurewebsites.net`
- Fleet API: `https://app-fleet-api.azurewebsites.net`
- Maintenance API: `https://app-fleet-maintenance.azurewebsites.net`
- Vehicle API: `https://app-fleet-vehicle.azurewebsites.net`

## Cost Optimization

```powershell
# Scale down when not in use
az appservice plan update `
  --name "plan-fleet-apis" `
  --resource-group "rg-fleet-maintenance" `
  --sku "F1"  # Free tier

# Scale up for production
az appservice plan update `
  --name "plan-fleet-apis" `
  --resource-group "rg-fleet-maintenance" `
  --sku "P1V2"  # Premium
```

## Monitoring

```powershell
# View logs
az webapp log tail --name "app-fleet-auth" --resource-group "rg-fleet-maintenance"

# Enable logging
az webapp log config `
  --name "app-fleet-auth" `
  --resource-group "rg-fleet-maintenance" `
  --application-logging filesystem `
  --level information
```

## Backup Strategy

```powershell
# Enable automatic backups for SQL Database
az sql db ltr-policy set `
  --resource-group "rg-fleet-maintenance" `
  --server "sql-fleet-maintenance" `
  --database "FleetMaintenanceDB" `
  --weekly-retention "P4W" `
  --monthly-retention "P12M"
```

## Security Best Practices

1. **Enable HTTPS Only**
```powershell
$apps = @("app-fleet-auth", "app-fleet-api", "app-fleet-maintenance", "app-fleet-vehicle")
foreach ($app in $apps) {
    az webapp update --resource-group "rg-fleet-maintenance" --name $app --https-only true
}
```

2. **Configure Minimum TLS Version**
```powershell
foreach ($app in $apps) {
    az webapp config set --resource-group "rg-fleet-maintenance" --name $app --min-tls-version 1.2
}
```

3. **Enable Azure AD Authentication** (Optional)
```powershell
az webapp auth update `
  --resource-group "rg-fleet-maintenance" `
  --name "app-fleet-auth" `
  --enabled true `
  --action LoginWithAzureActiveDirectory
```

## CI/CD Setup (GitHub Actions)

See DEPLOYMENT-CICD.md for automated deployment configuration.

## Estimated Monthly Costs (Basic Tier)

- App Service Plan (B1): ~$13/month × 2 = $26
- Azure SQL Database (S0): ~$15/month
- Static Web App (Free tier): $0
- Application Insights: ~$5/month
- **Total: ~$46/month**

Production tier (P1V2 + S1 SQL): ~$150-200/month
