# Fleet Maintenance Solution - IIS Deployment Script
# Run as Administrator

param(
    [string]$DeployPath = "C:\inetpub\FleetMaintenance",
    [string]$SqlServer = "ELIAS\SQLDEVELOPER",
    [string]$Database = "FleetMaintenanceDB",
    [switch]$SkipBuild = $false,
    [switch]$SkipIISSetup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " Fleet Maintenance Solution - IIS Deployment  " -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

# Import IIS Module
Import-Module WebAdministration -ErrorAction Stop

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Step 1: Create IIS Application Pools
if (-not $SkipIISSetup) {
    Write-Host "Creating IIS Application Pools..." -ForegroundColor Yellow
    
    $pools = @("FleetAuth", "FleetAPI", "MaintenanceAPI", "VehicleAPI", "FleetFrontend")
    foreach ($pool in $pools) {
        if (Test-Path "IIS:\AppPools\$pool") {
            Write-Host "  Application Pool '$pool' already exists, removing..." -ForegroundColor Gray
            Remove-WebAppPool -Name $pool
        }
        New-WebAppPool -Name $pool -Force | Out-Null
        Set-ItemProperty "IIS:\AppPools\$pool" -Name "managedRuntimeVersion" -Value ""
        Write-Host "  Created Application Pool: $pool" -ForegroundColor Green
    }
    Write-Host ""
}

# Step 2: Create Deployment Directories
Write-Host "Creating deployment directories..." -ForegroundColor Yellow
$authPath = Join-Path $DeployPath "Auth.API"
$fleetPath = Join-Path $DeployPath "Fleet.API"
$maintenancePath = Join-Path $DeployPath "Maintenance.API"
$vehiclePath = Join-Path $DeployPath "Vehicle.API"
$frontendPath = Join-Path $DeployPath "Frontend"

$paths = @($authPath, $fleetPath, $maintenancePath, $vehiclePath, $frontendPath)
foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        New-Item -Path $path -ItemType Directory -Force | Out-Null
        Write-Host "  Created: $path" -ForegroundColor Green
    }
}
Write-Host ""

# Step 3: Build Solution
if (-not $SkipBuild) {
    Write-Host "Building solution..." -ForegroundColor Yellow
    Push-Location $rootPath
    dotnet build FleetMaintenance.sln --configuration Release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "Build completed successfully." -ForegroundColor Green
    Pop-Location
    Write-Host ""
}

# Step 4: Publish APIs
Write-Host "Publishing APIs..." -ForegroundColor Yellow

Write-Host "  Publishing Auth.API..." -ForegroundColor Cyan
dotnet publish (Join-Path $rootPath "Auth.API\Auth.API.csproj") -c Release -o $authPath --no-build

Write-Host "  Publishing Fleet.API..." -ForegroundColor Cyan
dotnet publish (Join-Path $rootPath "Fleet.API\Fleet.API.csproj") -c Release -o $fleetPath --no-build

Write-Host "  Publishing Maintenance.API..." -ForegroundColor Cyan
dotnet publish (Join-Path $rootPath "Maintenance.API\Maintenance.API.csproj") -c Release -o $maintenancePath --no-build

Write-Host "  Publishing Vehicle.API..." -ForegroundColor Cyan
dotnet publish (Join-Path $rootPath "Vehicle.API\Vehicle.API.csproj") -c Release -o $vehiclePath --no-build

Write-Host "APIs published successfully." -ForegroundColor Green
Write-Host ""

# Step 5: Update Configuration Files
Write-Host "Updating configuration files..." -ForegroundColor Yellow

$connectionString = "Server=$SqlServer;Database=$Database;Integrated Security=true;TrustServerCertificate=true;"
$apiPaths = @($authPath, $fleetPath, $maintenancePath, $vehiclePath)

foreach ($apiPath in $apiPaths) {
    $configFile = Join-Path $apiPath "appsettings.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        $config.ConnectionStrings.DefaultConnection = $connectionString
        $config | ConvertTo-Json -Depth 10 | Set-Content $configFile
        Write-Host "  Updated: $(Split-Path $apiPath -Leaf)\appsettings.json" -ForegroundColor Green
    }
}
Write-Host ""

# Step 6: Create/Update IIS Sites
if (-not $SkipIISSetup) {
    Write-Host "Creating IIS Sites..." -ForegroundColor Yellow
    
    # Stop Default Website
    Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    
    # Create Sites
    $sites = @(
        @{Name="FleetAuth"; Port=5001; Path=$authPath; Pool="FleetAuth"},
        @{Name="FleetAPI"; Port=5002; Path=$fleetPath; Pool="FleetAPI"},
        @{Name="MaintenanceAPI"; Port=5003; Path=$maintenancePath; Pool="MaintenanceAPI"},
        @{Name="VehicleAPI"; Port=5000; Path=$vehiclePath; Pool="VehicleAPI"},
        @{Name="FleetFrontend"; Port=80; Path=$frontendPath; Pool="FleetFrontend"}
    )
    
    foreach ($site in $sites) {
        if (Test-Path "IIS:\Sites\$($site.Name)") {
            Remove-Website -Name $site.Name
        }
        New-Website -Name $site.Name -Port $site.Port -PhysicalPath $site.Path -ApplicationPool $site.Pool -Force | Out-Null
        Write-Host "  Created IIS Site: $($site.Name) on port $($site.Port)" -ForegroundColor Green
    }
    Write-Host ""
}

# Step 7: Set Permissions
Write-Host "Setting permissions..." -ForegroundColor Yellow
$pools = @("FleetAuth", "FleetAPI", "MaintenanceAPI", "VehicleAPI", "FleetFrontend")
foreach ($pool in $pools) {
    $identity = "IIS AppPool\$pool"
    $acl = Get-Acl $DeployPath
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($rule)
    Set-Acl $DeployPath $acl
    Write-Host "  Set permissions for: $pool" -ForegroundColor Green
}
Write-Host ""

# Step 8: Build and Deploy Frontend
Write-Host "Building  frontend..." -ForegroundColor Yellow
$frontendSource = Join-Path $rootPath "fleet-management-ui"
Push-Location $frontendSource

# Update API URLs for production (using server IP/hostname)
$hostname = [System.Net.Dns]::GetHostName()
$envProduction = @"
REACT_APP_AUTH_API_URL=http://${hostname}:5001/api
REACT_APP_FLEET_API_URL=http://${hostname}:5002/api
REACT_APP_MAINTENANCE_API_URL=http://${hostname}:5003/api
REACT_APP_VEHICLE_API_URL=http://${hostname}:5000/api
"@
$envProduction | Set-Content ".env.production"

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Copy build files
Copy-Item -Path "build\*" -Destination $frontendPath -Recurse -Force
Write-Host "Frontend deployed successfully." -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 9: Create web.config for React SPA
$webConfig = @"
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
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
"@
$webConfig | Set-Content (Join-Path $frontendPath "web.config")
Write-Host "Created web.config for SPA routing." -ForegroundColor Green
Write-Host ""

# Step 10: Restart IIS
Write-Host "Restarting IIS..." -ForegroundColor Yellow
iisreset
Write-Host ""

# Summary
Write-Host "===============================================" -ForegroundColor Green
Write-Host " Deployment Completed Successfully!           " -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Cyan
Write-Host "  Frontend:        http://${hostname}" -ForegroundColor White
Write-Host "  Auth API:        http://${hostname}:5001" -ForegroundColor White
Write-Host "  Fleet API:       http://${hostname}:5002" -ForegroundColor White
Write-Host "  Maintenance API: http://${hostname}:5003" -ForegroundColor White
Write-Host "  Vehicle API:     http://${hostname}:5000" -ForegroundColor White
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Cyan
Write-Host "  SystemAdmin: mashiaes@gmail.com / test123" -ForegroundColor Yellow
Write-Host "  TenantAdmin: Admin@TheCourier.co.za / test123" -ForegroundColor Yellow
Write-Host ""
