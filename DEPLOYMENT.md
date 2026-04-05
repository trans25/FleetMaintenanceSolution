# Fleet Maintenance Solution - Deployment Guide

## Overview

The Fleet Maintenance Solution can be deployed in three environments:
1. **Local Development** - Run all services locally
2. **IIS (On-Premise)** - Deploy to Windows Server with IIS
3. **Microsoft Azure** - Cloud deployment with Azure services

## Architecture

### Backend Services (ASP.NET Core 8.0)
- **Auth.API** (Port 5001) - Authentication and authorization
- **Fleet.API** (Port 5002) - Fleet and vehicle management
- **Maintenance.API** (Port 5003) - Maintenance records, job cards, schedules
- **Vehicle.API** (Port 5000) - Vehicle operations

### Frontend
- **React Application** (Port 3000 dev / Port 80 production)

### Database
- **SQL Server** - Multi-tenant architecture with Entity Framework Core 8.0

---

## 🏠 Local Development Deployment

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- SQL Server (ELIAS\SQLDEVELOPER or update connection strings)

### Quick Start

```powershell
# Start all services
.\deploy-local.ps1

# Stop all services
.\deploy-local.ps1 -StopOnly

# Clean and rebuild
.\deploy-local.ps1 -Clean
```

### Manual Start
```powershell
# Terminal 1: Auth API
cd Auth.API
dotnet run

# Terminal 2: Fleet API
cd Fleet.API
dotnet run

# Terminal 3: Maintenance API
cd Maintenance.API
dotnet run

# Terminal 4: Vehicle API
cd Vehicle.API
dotnet run

# Terminal 5: Frontend
cd fleet-management-ui
npm start
```

### Access URLs
- Frontend: http://localhost:3000
- Auth API: http://localhost:5001
- Fleet API: http://localhost:5002
- Maintenance API: http://localhost:5003
- Vehicle API: http://localhost:5000

---

## 🖥️ IIS Deployment

### Prerequisites
- Windows Server with IIS
- .NET 8.0 Hosting Bundle
- SQL Server accessible from IIS server
- URL Rewrite module for IIS

### Automated Deployment

**Run as Administrator:**
```powershell
.\deploy-iis.ps1
```

**Custom deployment path:**
```powershell
.\deploy-iis.ps1 -DeployPath "D:\WebSites\FleetMaintenance"
```

**Deploy without rebuilding:**
```powershell
.\deploy-iis.ps1 -SkipBuild
```

### Manual Deployment

See [DEPLOYMENT-IIS.md](DEPLOYMENT-IIS.md) for detailed step-by-step instructions.

### Post-Deployment Steps

1. **Update Connection Strings**
   Edit appsettings.json in each API deployment folder:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SQL_SERVER;Database=FleetMaintenanceDB;..."
     }
   }
   ```

2. **Configure Firewall**
   ```powershell
   New-NetFirewallRule -DisplayName "Fleet APIs" -Direction Inbound -LocalPort 5000,5001,5002,5003,80 -Protocol TCP -Action Allow
   ```

3. **Access Application**
   - http://YOUR_SERVER or http://YOUR_IP

---

## ☁️ Azure Deployment

### Prerequisites
- Azure Subscription
- Azure CLI installed and configured
- SQL Admin password (strong password required)

### Automated Deployment

```powershell
# Full deployment (infrastructure + apps)
.\deploy-azure.ps1 -ResourceGroup "rg-fleet-prod" -Location "eastus" -SqlAdminPassword "YourStrongPassword123!"

# Deploy only (infrastructure already exists)
.\deploy-azure.ps1 -ResourceGroup "rg-fleet-prod" -Location "eastus" -SqlAdminPassword "YourStrongPassword123!" -DeployOnly

# Skip infrastructure creation
.\deploy-azure.ps1 -ResourceGroup "rg-fleet-prod" -Location "eastus" -SqlAdminPassword "YourStrongPassword123!" -SkipInfrastructure
```

### Azure Resources Created

| Resource | Type | Purpose |
|----------|------|---------|
| Resource Group | Container | All resources |
| SQL Server + Database | PaaS Database | FleetMaintenanceDB |
| Key Vault | Secrets Management | Connection strings, JWT keys |
| App Service Plan | Compute | Host APIs (B1 tier) |
| 4x App Services | Web Apps | Auth, Fleet, Maintenance, Vehicle APIs |
| Static Web App | Frontend Hosting | React application |
| Application Insights | Monitoring | Telemetry and logs |

### Estimated Costs

| Tier | Monthly Cost | Use Case |
|------|-------------|----------|
| Basic (B1 + S0 SQL) | ~$40-50 | Development/Testing |
| Standard (S1 + S1 SQL) | ~$100-120 | Small Production |
| Premium (P1V2 + P1 SQL) | ~$200-250 | Production |

### Post-Deployment Steps

1. **Run Database Migrations**
   ```powershell
   # Update connection string
   $env:ConnectionStrings__DefaultConnection = "YOUR_AZURE_SQL_CONNECTION_STRING"
   
   # Run migrations
   cd Vehicle.API
   dotnet ef database update
   ```

2. **Configure CORS**
   ```powershell
   az webapp cors add --resource-group "rg-fleet-prod" --name "app-fleet-auth" --allowed-origins "https://YOUR_FRONTEND_URL"
   ```

3. **Deploy Frontend** (if SWA CLI not installed)
   ```powershell
   npm install -g @azure/static-web-apps-cli
   cd fleet-management-ui
   swa deploy ./build --deployment-token YOUR_TOKEN
   ```

### Monitoring

```powershell
# View logs
az webapp log tail --name "app-fleet-auth" --resource-group "rg-fleet-prod"

# View metrics
az monitor metrics list --resource "app-fleet-auth" --resource-group "rg-fleet-prod"
```

### Cleanup

```powershell
# Delete all resources
az group delete --name "rg-fleet-prod" --yes
```

---

## 🔐 Default Credentials

After deployment, use these credentials to login:

| Role | Email | Password |
|------|-------|----------|
| SystemAdmin | mashiaes@gmail.com | test123 |
| TenantAdmin | Admin@TheCourier.co.za | test123 |
| Technician | Tech@TheCourier.co.za | test123 |

**⚠️ IMPORTANT:** Change these passwords in production!

---

## 🔧 Configuration

### Environment Variables (Frontend)

The frontend uses environment variables to determine API endpoints:

**Development (.env)**
```
REACT_APP_AUTH_API_URL=http://localhost:5001/api
REACT_APP_FLEET_API_URL=http://localhost:5002/api
REACT_APP_MAINTENANCE_API_URL=http://localhost:5003/api
REACT_APP_VEHICLE_API_URL=http://localhost:5000/api
```

**IIS Production (.env.production)**
```
REACT_APP_AUTH_API_URL=http://YOUR_SERVER:5001/api
REACT_APP_FLEET_API_URL=http://YOUR_SERVER:5002/api
REACT_APP_MAINTENANCE_API_URL=http://YOUR_SERVER:5003/api
REACT_APP_VEHICLE_API_URL=http://YOUR_SERVER:5000/api
```

**Azure Production (auto-generated)**
```
REACT_APP_AUTH_API_URL=https://app-fleet-auth-XXXX.azurewebsites.net/api
REACT_APP_FLEET_API_URL=https://app-fleet-api-XXXX.azurewebsites.net/api
REACT_APP_MAINTENANCE_API_URL=https://app-fleet-maintenance-XXXX.azurewebsites.net/api
REACT_APP_VEHICLE_API_URL=https://app-fleet-vehicle-XXXX.azurewebsites.net/api
```

### Backend Configuration

Each API has an `appsettings.json` file:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_CONNECTION_STRING"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_SECRET_KEY_32_CHARS_MINIMUM",
    "Issuer": "FleetMaintenanceAuth",
    "Audience": "FleetMaintenanceApp",
    "ExpirationMinutes": 60
  },
  "AllowedHosts": "*"
}
```

---

## 🚀 CI/CD Options

### Option 1: GitHub Actions
See [DEPLOYMENT-CICD.md](DEPLOYMENT-CICD.md) for GitHub Actions workflow.

### Option 2: Azure DevOps
- Create Build Pipeline pointing to FleetMaintenance.sln
- Create Release Pipeline with Azure App Service Deploy tasks
- Configure triggers for automated deployment

### Option 3: Visual Studio Publish Profiles
Publish profiles are located in each API project's Properties folder.

---

## 📊 Monitoring & Troubleshooting

### Check Service Health

**IIS:**
```powershell
# Check if services are running
Get-Website | Select-Object Name, State, Bindings

# Check application pool status
Get-WebAppPoolState -Name "FleetAuth"

# View IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50
```

**Azure:**
```powershell
# Check app status
az webapp show --name "app-fleet-auth" --resource-group "rg-fleet-prod" --query state

# Stream logs
az webapp log tail --name "app-fleet-auth" --resource-group "rg-fleet-prod"

# Check metrics
az monitor app-insights metrics show --app "ai-fleet-maintenance" --metric requests/count
```

### Common Issues

**Issue: Cannot connect to database**
- Solution: Check connection string and firewall rules

**Issue: 502 Bad Gateway on IIS**
- Solution: Check .NET Hosting Bundle is installed, restart app pool

**Issue: CORS errors**
- Solution: Update AllowedOrigins in Program.cs or configure via Azure Portal

**Issue: 401 Unauthorized**
- Solution: Check JWT secret key matches between Auth API and other services

---

## 📚 Additional Resources

- [IIS Deployment Details](DEPLOYMENT-IIS.md)
- [Azure Deployment Details](DEPLOYMENT-AZURE.md)
- [Main README](README.md)
- [API Documentation](API-DOCUMENTATION.md) (if available)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review deployment logs
3. Check Application Insights (Azure) or Event Viewer (IIS)
4. Contact system administrator

---

## 🔄 Updating Deployed Applications

### IIS Updates
```powershell
# Quick update (no infrastructure changes)
.\deploy-iis.ps1 -SkipIISSetup
```

### Azure Updates
```powershell
# Deploy new version
.\deploy-azure.ps1 -ResourceGroup "rg-fleet-prod" -SqlAdminPassword "YourPassword" -DeployOnly
```

---

**Last Updated:** April 5, 2026
**Version:** 1.0.0
