# Fleet Maintenance Solution - Quick Deployment Reference

## 🚀 Choose Your Deployment

```powershell
# LOCAL DEVELOPMENT (Recommended for testing)
.\deploy-local.ps1

# IIS DEPLOYMENT (On-premise/Internal)
.\deploy-iis.ps1

# AZURE DEPLOYMENT (Cloud/Production)
.\deploy-azure.ps1 -ResourceGroup "rg-fleet" -Location "eastus" -SqlAdminPassword "YourPassword123!"
```

## 📋 Pre-Deployment Checklist

### All Environments
- [ ] .NET 8.0 SDK installed
- [ ] Node.js 18+ installed
- [ ] SQL Server accessible
- [ ] Solution builds successfully: `dotnet build FleetMaintenance.sln`

### IIS Only
- [ ] Running as Administrator
- [ ] IIS installed with ASP.NET Core module
- [ ] .NET 8.0 Hosting Bundle installed
- [ ] URL Rewrite module installed

### Azure Only
- [ ] Azure CLI installed: `az --version`
- [ ] Logged into Azure: `az login`
- [ ] Active subscription selected
- [ ] Strong SQL admin password ready

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| SystemAdmin | mashiaes@gmail.com | test123 |
| TenantAdmin | Admin@TheCourier.co.za | test123 |

**⚠️ Change passwords after first login in production!**

## 🌐 Access URLs

### Local Development
- Frontend: http://localhost:3000
- APIs: http://localhost:5000-5003

### IIS
- Frontend: http://YOUR_SERVER
- APIs: http://YOUR_SERVER:5000-5003

### Azure
- Frontend: https://YOUR-APP.azurestaticapps.net
- APIs: https://YOUR-APP.azurewebsites.net

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `.\deploy-local.ps1 -StopOnly` |
| Build fails | `dotnet clean && dotnet build` |
| Database error | Check connection string in appsettings.json |
| Frontend blank | Check browser console, verify API URLs |
| 502 on IIS | Install .NET Hosting Bundle, restart app pool |
| Azure connection fails | Check firewall rules, verify Key Vault access |

## 📞 Need Help?

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
2. Check [DEPLOYMENT-IIS.md](DEPLOYMENT-IIS.md) for IIS specifics
3. Check [DEPLOYMENT-AZURE.md](DEPLOYMENT-AZURE.md) for Azure specifics
4. Review error logs in Application Insights or IIS logs

## 💰 Estimated Azure Costs

| Tier | Monthly | Use Case |
|------|---------|----------|
| Dev/Test | $40-50 | B1 + S0 SQL |
| Production | $100-120 | S1 + S1 SQL |
| Enterprise | $200-250 | P1V2 + P1 SQL |

## 🔄 Common Commands

```powershell
# Local: Stop all services
.\deploy-local.ps1 -StopOnly

# Local: Clean rebuild
.\deploy-local.ps1 -Clean

# IIS: Update deployment
.\deploy-iis.ps1 -SkipIISSetup

# Azure: Update apps only
.\deploy-azure.ps1 -ResourceGroup "rg-fleet" -SqlAdminPassword "Pass" -DeployOnly

# Azure: View logs
az webapp log tail --name "app-fleet-auth" --resource-group "rg-fleet"

# Azure: Delete everything
az group delete --name "rg-fleet" --yes
```

---

**Quick Start:** `.\deploy-local.ps1` → Open http://localhost:3000 → Login with mashiaes@gmail.com / test123
