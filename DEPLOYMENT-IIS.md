# Fleet Maintenance Solution - IIS Deployment Guide

## Prerequisites
- Windows Server with IIS installed
- .NET 8.0 Hosting Bundle installed
- SQL Server accessible from IIS server
- URL Rewrite module for IIS (for React SPA)

## Step 1: Prepare IIS

### Install Required Components
```powershell
# Install .NET 8.0 Hosting Bundle
# Download from: https://dotnet.microsoft.com/download/dotnet/8.0

# Enable IIS features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45

# Install URL Rewrite Module (for React SPA)
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
```

## Step 2: Create Application Pools

Run PowerShell as Administrator:

```powershell
Import-Module WebAdministration

# Create Application Pools
New-WebAppPool -Name "FleetAuth" -Force
New-WebAppPool -Name "FleetAPI" -Force
New-WebAppPool -Name "MaintenanceAPI" -Force
New-WebAppPool -Name "VehicleAPI" -Force
New-WebAppPool -Name "FleetFrontend" -Force

# Configure Application Pools
$pools = @("FleetAuth", "FleetAPI", "MaintenanceAPI", "VehicleAPI")
foreach ($pool in $pools) {
    Set-ItemProperty "IIS:\AppPools\$pool" -Name "managedRuntimeVersion" -Value ""  # No Managed Code
    Set-ItemProperty "IIS:\AppPools\$pool" -Name "enable32BitAppOnWin64" -Value $false
}

# Configure Frontend Pool for static files
Set-ItemProperty "IIS:\AppPools\FleetFrontend" -Name "managedPipelineMode" -Value "Integrated"
```

## Step 3: Create IIS Websites

```powershell
# Define deployment paths
$deployPath = "C:\inetpub\FleetMaintenance"
$authPath = Join-Path $deployPath "Auth.API"
$fleetPath = Join-Path $deployPath "Fleet.API"
$maintenancePath = Join-Path $deployPath "Maintenance.API"
$vehiclePath = Join-Path $deployPath "Vehicle.API"
$frontendPath = Join-Path $deployPath "Frontend"

# Create directories
New-Item -Path $authPath -ItemType Directory -Force
New-Item -Path $fleetPath -ItemType Directory -Force
New-Item -Path $maintenancePath -ItemType Directory -Force
New-Item -Path $vehiclePath -ItemType Directory -Force
New-Item -Path $frontendPath -ItemType Directory -Force

# Create IIS Sites
New-Website -Name "FleetAuth" -Port 5001 -PhysicalPath $authPath -ApplicationPool "FleetAuth" -Force
New-Website -Name "FleetAPI" -Port 5002 -PhysicalPath $fleetPath -ApplicationPool "FleetAPI" -Force
New-Website -Name "MaintenanceAPI" -Port 5003 -PhysicalPath $maintenancePath -ApplicationPool "MaintenanceAPI" -Force
New-Website -Name "VehicleAPI" -Port 5000 -PhysicalPath $vehiclePath -ApplicationPool "VehicleAPI" -Force
New-Website -Name "FleetFrontend" -Port 80 -PhysicalPath $frontendPath -ApplicationPool "FleetFrontend" -Force

# Set permissions
$pools = @("FleetAuth", "FleetAPI", "MaintenanceAPI", "VehicleAPI", "FleetFrontend")
foreach ($pool in $pools) {
    $identity = "IIS AppPool\$pool"
    $acl = Get-Acl (Get-Item "IIS:\AppPools\$pool").PSPath
    icacls "$deployPath\*" /grant "${identity}:(OI)(CI)F" /T
}
```

## Step 4: Build and Publish APIs

Run from solution directory:

```powershell
# Build solution
dotnet build FleetMaintenance.sln --configuration Release

# Publish each API
dotnet publish Auth.API/Auth.API.csproj -c Release -o C:\inetpub\FleetMaintenance\Auth.API
dotnet publish Fleet.API/Fleet.API.csproj -c Release -o C:\inetpub\FleetMaintenance\Fleet.API
dotnet publish Maintenance.API/Maintenance.API.csproj -c Release -o C:\inetpub\FleetMaintenance\Maintenance.API
dotnet publish Vehicle.API/Vehicle.API.csproj -c Release -o C:\inetpub\FleetMaintenance\Vehicle.API
```

## Step 5: Configure Connection Strings

Update appsettings.json in each published API:

**C:\inetpub\FleetMaintenance\Auth.API\appsettings.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SQL_SERVER;Database=FleetMaintenanceDB;Integrated Security=true;TrustServerCertificate=true;"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_PRODUCTION_SECRET_KEY_HERE_MINIMUM_32_CHARS",
    "Issuer": "FleetMaintenanceAuth",
    "Audience": "FleetMaintenanceApp",
    "ExpirationMinutes": 60
  },
  "AllowedHosts": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

Repeat for Fleet.API, Maintenance.API, and Vehicle.API with the same connection string.

## Step 6: Build and Deploy Frontend

```powershell
# Update API URLs in frontend
cd fleet-management-ui

# Create production environment file
# Edit src/services/api.js to use production URLs or environment variables
```

Build for production:
```powershell
npm run build

# Copy build to IIS
Copy-Item -Path "build\*" -Destination "C:\inetpub\FleetMaintenance\Frontend" -Recurse -Force
```

Create web.config in C:\inetpub\FleetMaintenance\Frontend\web.config:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
  </system.webServer>
</configuration>
```

## Step 7: Configure CORS

Update each API's Program.cs or add to appsettings.json:

```json
{
  "Cors": {
    "AllowedOrigins": ["http://YOUR_SERVER_IP", "http://YOUR_DOMAIN"]
  }
}
```

## Step 8: Start Services

```powershell
# Restart IIS
iisreset

# Or restart individual sites
Restart-WebAppPool -Name "FleetAuth"
Restart-WebAppPool -Name "FleetAPI"
Restart-WebAppPool -Name "MaintenanceAPI"
Restart-WebAppPool -Name "VehicleAPI"
Restart-WebAppPool -Name "FleetFrontend"
```

## Step 9: Configure Firewall

```powershell
# Open ports on Windows Firewall
New-NetFirewallRule -DisplayName "Fleet Auth API" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Fleet API" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Maintenance API" -Direction Inbound -LocalPort 5003 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Vehicle API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Fleet Frontend" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

## Access URLs

After deployment:
- Frontend: http://YOUR_SERVER_IP or http://YOUR_DOMAIN
- Auth API: http://YOUR_SERVER_IP:5001
- Fleet API: http://YOUR_SERVER_IP:5002
- Maintenance API: http://YOUR_SERVER_IP:5003
- Vehicle API: http://YOUR_SERVER_IP:5000

## Troubleshooting

### Check IIS Logs
```
C:\inetpub\logs\LogFiles\
```

### Check Application Event Logs
```powershell
Get-EventLog -LogName Application -Source "IIS*" -Newest 50
```

### Enable Detailed Errors
Add to web.config in each API:
```xml
<aspNetCore ... stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" />
```

### Verify .NET Runtime
```powershell
dotnet --list-runtimes
```
