# Quick Start Guide - Fleet Maintenance System

## 🚀 5-Minute Setup

### Step 1: Build the Solution

```powershell
cd FleetMaintenanceSolution
dotnet build
```

### Step 2: Create Database

```powershell
cd Vehicle.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

This creates the database with:
- All tables (Tenants, Users, Roles, Fleets, Vehicles, etc.)
- Seed data for 4 roles: SystemAdmin, TenantAdmin, Technician, Driver

### Step 3: Create Test Data

Run these SQL scripts in SQL Server Management Studio or Azure Data Studio:

```sql
USE FleetMaintenanceDB;

-- Create a test tenant
INSERT INTO Tenants (Name, ContactEmail, ContactPhone, IsActive, CreatedAt)
VALUES ('Acme Transport', 'contact@acme.com', '+1-555-0100', 1, GETUTCDATE());

-- Create a test user (password: "admin123")
INSERT INTO Users (TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
VALUES (1, 'admin', 'admin@acme.com', 'admin123', 'John', 'Doe', 1, GETUTCDATE());

-- Assign SystemAdmin role to user
INSERT INTO UserRoles (UsersId, RolesId) VALUES (1, 1);

-- Create a manufacturer
INSERT INTO Manufacturers (Name, Country, Website, CreatedAt)
VALUES ('Toyota', 'Japan', 'https://www.toyota.com', GETUTCDATE());

-- Create a fleet
INSERT INTO Fleets (TenantId, Name, Description, Location, IsActive, CreatedAt)
VALUES (1, 'Main Fleet', 'Primary vehicle fleet', 'New York HQ', 1, GETUTCDATE());

-- Create test vehicles
INSERT INTO Vehicles (FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
VALUES 
(1, 1, 'NYC-001', '1HGBH41JXMN109186', 'Toyota Camry', 2023, 'White', 15000.50, 'Active', '2023-01-15', GETUTCDATE()),
(1, 1, 'NYC-002', '2HGBH41JXMN109287', 'Toyota Corolla', 2023, 'Blue', 12500.00, 'Active', '2023-02-20', GETUTCDATE()),
(1, 1, 'NYC-003', '3HGBH41JXMN109388', 'Toyota RAV4', 2024, 'Black', 5000.00, 'Active', '2024-01-10', GETUTCDATE());
```

### Step 4: Run the API

```powershell
cd Vehicle.API
dotnet run
```

### Step 5: Test with Swagger

1. Open browser: https://localhost:5001/swagger
2. Test the `/api/auth/login` endpoint first:

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

3. Copy the token from the response
4. Click **Authorize** button in Swagger
5. Enter: `Bearer {paste-your-token-here}`
6. Now test other endpoints!

## 📋 Quick API Tests

### Test 1: Get All Vehicles

**GET** `/api/vehicle`

Expected: Returns array of 3 vehicles

### Test 2: Get Vehicle by ID

**GET** `/api/vehicle/1`

Expected: Returns NYC-001 Toyota Camry details

### Test 3: Get Vehicles by Fleet

**GET** `/api/vehicle/fleet/1`

Expected: Returns all vehicles in Main Fleet

### Test 4: Create New Vehicle

**POST** `/api/vehicle`

```json
{
  "fleetId": 1,
  "manufacturerId": 1,
  "registrationNumber": "NYC-004",
  "vin": "4HGBH41JXMN109489",
  "model": "Toyota Highlander",
  "year": 2024,
  "color": "Silver",
  "mileage": 100,
  "status": "Active",
  "purchaseDate": "2024-04-04T00:00:00Z"
}
```

### Test 5: Update Vehicle Mileage

**PUT** `/api/vehicle/1`

```json
{
  "id": 1,
  "fleetId": 1,
  "manufacturerId": 1,
  "registrationNumber": "NYC-001",
  "vin": "1HGBH41JXMN109186",
  "model": "Toyota Camry",
  "year": 2023,
  "color": "White",
  "mileage": 16500.75,
  "status": "Active",
  "purchaseDate": "2023-01-15T00:00:00Z"
}
```

## 🧪 Testing with PowerShell

### Login and Get Token

```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://localhost:5001/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -SkipCertificateCheck

$token = $response.token
Write-Host "Token: $token"
```

### Get All Vehicles

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$vehicles = Invoke-RestMethod -Uri "https://localhost:5001/api/vehicle" `
    -Method GET `
    -Headers $headers `
    -SkipCertificateCheck

$vehicles | Format-Table Id, RegistrationNumber, Model, Year, Mileage
```

### Create New Vehicle

```powershell
$newVehicle = @{
    fleetId = 1
    manufacturerId = 1
    registrationNumber = "NYC-005"
    vin = "5HGBH41JXMN109590"
    model = "Toyota Prius"
    year = 2024
    color = "Green"
    mileage = 50
    status = "Active"
    purchaseDate = "2024-04-04T00:00:00Z"
} | ConvertTo-Json

$newVehicleResult = Invoke-RestMethod -Uri "https://localhost:5001/api/vehicle" `
    -Method POST `
    -Headers $headers `
    -Body $newVehicle `
    -ContentType "application/json" `
    -SkipCertificateCheck

Write-Host "Created vehicle with ID: $($newVehicleResult.id)"
```

## 🔍 Verify Database

Check your database to see all tables:

```sql
-- View all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';

-- View all vehicles
SELECT v.Id, v.RegistrationNumber, v.Model, v.Year, v.Mileage, v.Status,
       m.Name as Manufacturer, f.Name as Fleet
FROM Vehicles v
JOIN Manufacturers m ON v.ManufacturerId = m.Id
JOIN Fleets f ON v.FleetId = f.Id;

-- View all users with roles
SELECT u.Username, u.Email, STRING_AGG(r.Name, ', ') as Roles
FROM Users u
JOIN UserRoles ur ON u.Id = ur.UsersId
JOIN Roles r ON ur.RolesId = r.Id
GROUP BY u.Username, u.Email;
```

## 🎯 Next Steps

1. **Explore Other Entities**: Try creating Faults, JobCards, ServiceSchedules
2. **Test Authorization**: Create users with different roles and test access
3. **Add More Microservices**: Create Fleet.API, JobCard.API following the same pattern
4. **Frontend**: Build a React/Angular/Blazor frontend using this API
5. **Deploy**: Deploy to Azure App Service or AWS Elastic Beanstalk

## 🆘 Troubleshooting

### Issue: Can't connect to database

**Solution**: Make sure SQL Server LocalDB is running:
```powershell
sqllocaldb start mssqllocaldb
```

### Issue: 401 Unauthorized

**Solution**: Make sure you:
1. Got a valid token from `/api/auth/login`
2. Added `Bearer ` prefix before the token
3. Token hasn't expired (60 minutes)

### Issue: Entity Framework error

**Solution**: Delete migrations and recreate:
```powershell
cd Vehicle.API
Remove-Item -Recurse -Force Migrations
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 📞 Need Help?

Check the main [README.md](README.md) for detailed documentation.

---

**Happy Coding! 🚗💨**
