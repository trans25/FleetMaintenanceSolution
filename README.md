# Fleet Maintenance System - Microservices Backend

A production-ready microservices backend for Fleet Maintenance System built with .NET 8.

## 🏗️ Architecture

This system uses a **microservices architecture** with three independent API services. See [MICROSERVICES.md](MICROSERVICES.md) for detailed documentation.

- **Auth.API** (Port 5001) - Authentication & Authorization
- **Fleet.API** (Port 5002) - Fleet & Vehicle Management  
- **Maintenance.API** (Port 5003) - Maintenance Operations
- **Fleet.Core** - Shared domain library

## 📁 Project Structure

```
FleetMaintenanceSolution/
├── Fleet.Core/                    # Shared class library
│   ├── Domain/                    # Entity models
│   │   ├── Tenant.cs
│   │   ├── User.cs
│   │   ├── Role.cs
│   │   ├── Fleet.cs
│   │   ├── Vehicle.cs
│   │   ├── Manufacturer.cs
│   │   ├── ServiceSchedule.cs
│   │   ├── Fault.cs
│   │   ├── JobCard.cs
│   │   └── JobCardTask.cs
│   ├── Interfaces/                # Repository interfaces
│   ├── Repositories/              # Repository implementations
│   ├── Services/                  # Business logic layer
│   └── Data/
│       └── ApplicationDbContext.cs
│
├── Auth.API/                      # Authentication microservice (Port 5001)
│   ├── Controllers/
│   │   └── AuthController.cs
│   ├── Services/
│   │   └── AuthService.cs
│   └── Program.cs
│
├── Fleet.API/                     # Fleet & Vehicle microservice (Port 5002)
│   ├── Controllers/
│   │   ├── FleetController.cs
│   │   └── VehicleController.cs
│   └── Program.cs
│
├── Maintenance.API/               # Maintenance microservice (Port 5003)
│   ├── Controllers/
│   │   ├── FaultController.cs
│   │   ├── JobCardController.cs
│   │   └── ServiceScheduleController.cs
│   └── Program.cs
│
└── Vehicle.API/                   # Legacy monolithic API (deprecated)
    └── ...
```

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- SQL Server (LocalDB or full SQL Server instance)
- Visual Studio 2022 or VS Code

### Quick Start

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

### 1. Restore Packages

```powershell
cd FleetMaintenanceSolution
dotnet restore
```

### 2. Update Database Connection String

Update connection string in all `appsettings.json` files:
- `Auth.API/appsettings.json`
- `Fleet.API/appsettings.json`
- `Maintenance.API/appsettings.json`

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FleetMaintenanceDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
}
```

### 3. Create Database Migrations

Database migrations are in the legacy `Vehicle.API` project:

```powershell
cd Vehicle.API
dotnet ef database update
```

### 4. Run All Microservices

**Option 1: Visual Studio**
- Set multiple startup projects (Auth.API, Fleet.API, Maintenance.API)
- Press F5

**Option 2: Command Line**

```powershell
# Terminal 1 - Auth API
cd Auth.API
dotnet run

# Terminal 2 - Fleet API  
cd Fleet.API
dotnet run

# Terminal 3 - Maintenance API
cd Maintenance.API
dotnet run
```

The APIs will be available at:
- **Auth API**: http://localhost:5001 ([Swagger](http://localhost:5001/swagger))
- **Fleet API**: http://localhost:5002 ([Swagger](http://localhost:5002/swagger))
- **Maintenance API**: http://localhost:5003 ([Swagger](http://localhost:5003/swagger))

## 🔐 Authentication

The system uses JWT Bearer token authentication with role-based authorization across all microservices.

### Getting a Token

**POST** `http://localhost:5001/api/Auth/login`

Request:
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Response:
```json
{
  "token": "eyJhbGci...",
  "username": "admin",
  "email": "admin@fleet.com",
  "roles": ["SystemAdmin"]
}
```

### Using the Token

Add the token to all requests to Fleet.API and Maintenance.API:

```http
Authorization: Bearer eyJhbGci...
```

### Roles

- **SystemAdmin**: Full system access
- **TenantAdmin**: Tenant-level administrative access
- **FleetManager**: Fleet and vehicle management
- **Technician**: Maintenance operations
- **Staff**: Limited operations access
- **Auditor**: Read-only access
- **Guest**: Minimal view access

## 📡 API Endpoints

For detailed endpoint documentation, see:
- [Auth.API Endpoints](Auth.API/README.md)
- [Fleet.API Endpoints](Fleet.API/README.md)
- [Maintenance.API Endpoints](Maintenance.API/README.md)
- [Complete Microservices Guide](MICROSERVICES.md)

### Quick Reference

**Authentication:**
- `POST /api/Auth/login` - Get JWT token

**Fleet Management:**
- `GET/POST/PUT/DELETE /api/Fleet` - Fleet operations
- `GET/POST/PUT/DELETE /api/Vehicle` - Vehicle operations

**Maintenance:**
- `GET/POST/PUT/DELETE /api/Fault` - Fault tracking
- `GET/POST/PUT/DELETE /api/JobCard` - Job card management
- `GET/POST/PUT/DELETE /api/ServiceSchedule` - Service scheduling

### Example Request

**GET** `/api/vehicle`

Headers:
```
Authorization: Bearer {your-jwt-token}
```

Response:
```json
[
  {
    "id": 1,
    "fleetId": 1,
    "manufacturerId": 1,
    "registrationNumber": "ABC-123",
    "vin": "1HGBH41JXMN109186",
    "model": "Toyota Camry",
    "year": 2023,
    "color": "White",
    "mileage": 15000.50,
    "status": "Active",
    "purchaseDate": "2023-01-15T00:00:00Z",
    "lastServiceDate": "2024-03-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

## 🏗️ Architecture

### Fleet.Core Library

The core library implements:

- **Domain Models**: All entities with proper relationships
- **Repository Pattern**: Generic `IRepository<T>` with specific implementations
- **EF Core DbContext**: Complete database configuration with:
  - Fluent API configurations
  - Relationships and constraints
  - Indexes for performance
  - Seed data for roles

### Vehicle.API

The API microservice provides:

- **RESTful API**: Full CRUD operations for vehicles
- **JWT Authentication**: Secure token-based auth
- **Role-Based Authorization**: Fine-grained access control
- **Swagger/OpenAPI**: Interactive API documentation
- **Dependency Injection**: Repository pattern via DI
- **Error Handling**: Comprehensive exception handling
- **Logging**: Built-in logging support

## 🔧 Configuration

### JWT Settings

Edit `appsettings.json`:

```json
"JwtSettings": {
  "SecretKey": "YourSuperSecretKeyForJWTTokenGeneration123456!",
  "Issuer": "FleetMaintenanceAPI",
  "Audience": "FleetMaintenanceClients",
  "ExpirationMinutes": 60
}
```

⚠️ **Important**: Change the `SecretKey` in production and store it securely (Azure Key Vault, AWS Secrets Manager, etc.)

## 📦 Creating NuGet Package

To package Fleet.Core as a NuGet package:

```powershell
cd Fleet.Core
dotnet pack -c Release
```

The NuGet package will be created in `Fleet.Core/bin/Release/`

## 🗄️ Database Schema

The system manages the following entities:

- **Tenant**: Multi-tenant support
- **User**: System users with role-based access
- **Role**: Predefined roles (SystemAdmin, TenantAdmin, Technician, Driver)
- **Fleet**: Vehicle fleets per tenant
- **Vehicle**: Individual vehicles with full tracking
- **Manufacturer**: Vehicle manufacturers
- **ServiceSchedule**: Scheduled maintenance
- **Fault**: Vehicle fault reporting
- **JobCard**: Maintenance job cards
- **JobCardTask**: Individual tasks within job cards

## 🧪 Testing with Swagger

1. Run the application
2. Navigate to https://localhost:5001/swagger
3. Click "Authorize" button
4. Enter: `Bearer {your-jwt-token}`
5. Test endpoints interactively

## 📝 Production Considerations

Before deploying to production:

1. **Password Hashing**: Implement BCrypt or Argon2 for password hashing
2. **Connection Strings**: Use secure configuration providers
3. **JWT Secret**: Store in Azure Key Vault or similar
4. **CORS**: Configure specific allowed origins
5. **Rate Limiting**: Implement API rate limiting
6. **Logging**: Configure structured logging (Serilog, NLog)
7. **Health Checks**: Add health check endpoints
8. **API Versioning**: Implement versioning strategy
9. **Database Migrations**: Use proper migration strategy for production
10. **Error Handling**: Implement global exception handler

## 🔄 Adding More Microservices

To add additional microservices (e.g., Fleet.API, JobCard.API):

1. Create new Web API project
2. Reference Fleet.Core
3. Register required repositories in DI
4. Implement controllers following the same pattern
5. Configure JWT authentication (use same secret key for all services)

## 📄 License

This is a production-ready template for Fleet Maintenance System.

## 🤝 Support

For issues or questions, please create an issue in the repository.

---

**Built with .NET 8 | EF Core 8 | JWT Authentication | Repository Pattern**
