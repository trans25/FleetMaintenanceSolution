# Fleet Maintenance Solution - Local Deployment Script
# This script starts all services for local development

param(
    [switch]$StopOnly = $false,
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host " Fleet Maintenance Solution - Deployment Script " -NoNewline -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan
Write-Host ""

# Define project paths
$rootPath = $PSScriptRoot
$authApiPath = Join-Path $rootPath "Auth.API"
$fleetApiPath = Join-Path $rootPath "Fleet.API"
$maintenanceApiPath = Join-Path $rootPath "Maintenance.API"
$vehicleApiPath = Join-Path $rootPath "Vehicle.API"
$frontendPath = Join-Path $rootPath "fleet-management-ui"

# Function to stop all services
function Stop-AllServices {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    
    # Get all dotnet processes running our APIs
    $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | 
        Where-Object { $_.MainWindowTitle -like "*Auth.API*" -or 
                       $_.MainWindowTitle -like "*Fleet.API*" -or 
                       $_.MainWindowTitle -like "*Maintenance.API*" -or 
                       $_.MainWindowTitle -like "*Vehicle.API*" }
    
    # Stop dotnet processes by port
    $ports = @(5000, 5001, 5002, 5003, 3000)
    foreach ($port in $ports) {
        $connections = netstat -ano | Select-String ":$port.*LISTENING"
        if ($connections) {
            $connections | ForEach-Object {
                $parts = $_ -split '\s+'
                $pid = $parts[-1]
                if ($pid -and $pid -ne "0") {
                    try {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Host "  Stopped process on port $port (PID: $pid)" -ForegroundColor Green
                    } catch {
                        Write-Host "  Could not stop process on port $port" -ForegroundColor Red
                    }
                }
            }
        }
    }
    
    Start-Sleep -Seconds 2
    Write-Host "All services stopped." -ForegroundColor Green
    Write-Host ""
}

# Function to clean builds
function Clean-Builds {
    Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
    
    $projects = @($authApiPath, $fleetApiPath, $maintenanceApiPath, $vehicleApiPath)
    foreach ($project in $projects) {
        if (Test-Path $project) {
            $binPath = Join-Path $project "bin"
            $objPath = Join-Path $project "obj"
            
            if (Test-Path $binPath) {
                Remove-Item -Path $binPath -Recurse -Force
                Write-Host "  Cleaned bin folder in $(Split-Path $project -Leaf)" -ForegroundColor Green
            }
            if (Test-Path $objPath) {
                Remove-Item -Path $objPath -Recurse -Force
                Write-Host "  Cleaned obj folder in $(Split-Path $project -Leaf)" -ForegroundColor Green
            }
        }
    }
    
    # Clean frontend
    $nodeModules = Join-Path $frontendPath "node_modules"
    $buildFolder = Join-Path $frontendPath "build"
    
    if (Test-Path $nodeModules) {
        Write-Host "  Skipping node_modules cleanup (too large, run manually if needed)" -ForegroundColor Yellow
    }
    if (Test-Path $buildFolder) {
        Remove-Item -Path $buildFolder -Recurse -Force
        Write-Host "  Cleaned build folder in frontend" -ForegroundColor Green
    }
    
    Write-Host "Clean completed." -ForegroundColor Green
    Write-Host ""
}

# Stop services if requested
if ($StopOnly) {
    Stop-AllServices
    Write-Host "To restart services, run: .\deploy-local.ps1" -ForegroundColor Cyan
    exit 0
}

# Clean if requested
if ($Clean) {
    Stop-AllServices
    Clean-Builds
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check .NET SDK
try {
    $dotnetVersion = dotnet --version
    Write-Host "  .NET SDK: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: .NET SDK not found!" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found!" -ForegroundColor Red
    exit 1
}

# Check SQL Server connection
Write-Host "  Checking SQL Server connection..." -NoNewline
try {
    $result = sqlcmd -S "ELIAS\SQLDEVELOPER" -Q "SELECT 1" -b 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Connected" -ForegroundColor Green
    } else {
        Write-Host " Failed" -ForegroundColor Red
        Write-Host "  ERROR: Cannot connect to SQL Server ELIAS\SQLDEVELOPER" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " Failed" -ForegroundColor Red
    Write-Host "  ERROR: sqlcmd not found or SQL Server not accessible" -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisites check completed." -ForegroundColor Green
Write-Host ""

# Build all backend projects
Write-Host "Building backend services..." -ForegroundColor Yellow
Push-Location $rootPath
try {
    dotnet build FleetMaintenance.sln --configuration Release
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "Backend build completed successfully." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Backend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Install frontend dependencies if needed
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
Push-Location $frontendPath
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Frontend npm install failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Write-Host "Frontend dependencies ready." -ForegroundColor Green
Pop-Location
Write-Host ""

# Start services
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start Auth.API
Write-Host "Starting Auth.API on port 5001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$authApiPath'; Write-Host 'Auth.API Starting...' -ForegroundColor Cyan; dotnet run --configuration Release" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Fleet.API
Write-Host "Starting Fleet.API on port 5002..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$fleetApiPath'; Write-Host 'Fleet.API Starting...' -ForegroundColor Cyan; dotnet run --configuration Release" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Maintenance.API
Write-Host "Starting Maintenance.API on port 5003..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$maintenanceApiPath'; Write-Host 'Maintenance.API Starting...' -ForegroundColor Cyan; dotnet run --configuration Release" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Vehicle.API
Write-Host "Starting Vehicle.API on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$vehicleApiPath'; Write-Host 'Vehicle.API Starting...' -ForegroundColor Cyan; dotnet run --configuration Release" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting React Frontend on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'React Frontend Starting...' -ForegroundColor Cyan; npm start" -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host " All Services Started! " -NoNewline -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  Auth API:        http://localhost:5001" -ForegroundColor White
Write-Host "  Fleet API:       http://localhost:5002" -ForegroundColor White
Write-Host "  Maintenance API: http://localhost:5003" -ForegroundColor White
Write-Host "  Vehicle API:     http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Cyan
Write-Host "  SystemAdmin:  mashiaes@gmail.com / test123" -ForegroundColor Yellow
Write-Host "  TenantAdmin:  Admin@TheCourier.co.za / test123" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop all services, run: .\deploy-local.ps1 -StopOnly" -ForegroundColor Cyan
Write-Host "To clean and rebuild, run: .\deploy-local.ps1 -Clean" -ForegroundColor Cyan
Write-Host ""
