# Fleet Maintenance Microservices Architecture

This document describes the microservices architecture for the Fleet Maintenance System.

## Architecture Overview

The system has been refactored from a monolithic architecture into a **microservices architecture** with three independent API services:

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
│            (Web, Mobile, Desktop, etc.)                  │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │ Auth API │   │Fleet API │   │Maintenance   │
    │          │   │          │   │API           │
    │Port 5001 │   │Port 5002 │   │Port 5003     │
    └──────────┘   └──────────┘   └──────────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                ┌──────────▼──────────┐
                │   Fleet.Core        │
                │   (Shared Library)  │
                └─────────────────────┘
                           │
                ┌──────────▼──────────┐
                │  SQL Server DB      │
                │ FleetMaintenanceDB  │
                └─────────────────────┘
```

## Microservices

### 1. Auth.API - Authentication & Authorization Service
**Port:** 5001 (HTTP), 7001 (HTTPS)  
**Responsibility:** User authentication and JWT token generation

**Endpoints:**
- `POST /api/Auth/login` - Authenticate user and receive JWT token

**Dependencies:**
- Fleet.Core (Domain models, User/Role/Tenant repositories)
- Shared database (Users, Roles, Tenants tables)

**Key Features:**
- JWT token generation
- User credential validation
- Role-based claims assignment
- Multi-tenant support

---

### 2. Fleet.API - Fleet & Vehicle Management Service
**Port:** 5002 (HTTP), 7002 (HTTPS)  
**Responsibility:** Managing fleets and vehicles

**Controllers:**
- **FleetController** - Fleet management operations
- **VehicleController** - Vehicle management operations

**Key Endpoints:**
- `GET/POST/PUT/DELETE /api/Fleet` - Fleet CRUD operations
- `GET /api/Fleet/tenant/{tenantId}` - Get fleets by tenant
- `GET /api/Fleet/active` - Get active fleets
- `GET/POST/PUT/DELETE /api/Vehicle` - Vehicle CRUD operations
- `GET /api/Vehicle/registration/{registrationNumber}` - Find vehicle by registration
- `GET /api/Vehicle/vin/{vin}` - Find vehicle by VIN
- `GET /api/Vehicle/fleet/{fleetId}` - Get vehicles by fleet
- `GET /api/Vehicle/status/{status}` - Get vehicles by status

**Dependencies:**
- Fleet.Core (Domain models, Fleet/Vehicle/Manufacturer repositories and services)
- Shared database (Fleets, Vehicles, Manufacturers tables)

---

### 3. Maintenance.API - Maintenance Operations Service
**Port:** 5003 (HTTP), 7003 (HTTPS)  
**Responsibility:** Managing maintenance operations (faults, job cards, service schedules)

**Controllers:**
- **FaultController** - Vehicle fault/issue tracking
- **JobCardController** - Work order management
- **ServiceScheduleController** - Preventive maintenance scheduling

**Key Endpoints:**

**Faults:**
- `GET/POST/PUT/DELETE /api/Fault` - Fault CRUD operations
- `GET /api/Fault/vehicle/{vehicleId}` - Get faults by vehicle
- `GET /api/Fault/status/{status}` - Get faults by status
- `GET /api/Fault/severity/{severity}` - Get faults by severity
- `GET /api/Fault/open` - Get open faults

**Job Cards:**
- `GET/POST/PUT/DELETE /api/JobCard` - Job card CRUD operations
- `GET /api/JobCard/vehicle/{vehicleId}` - Get job cards by vehicle
- `GET /api/JobCard/assigned/{userId}` - Get job cards assigned to user
- `GET /api/JobCard/status/{status}` - Get job cards by status
- `GET /api/JobCard/{jobCardId}/tasks` - Get tasks for a job card
- `POST /api/JobCard/{jobCardId}/tasks` - Add task to job card

**Service Schedules:**
- `GET/POST/PUT/DELETE /api/ServiceSchedule` - Schedule CRUD operations
- `GET /api/ServiceSchedule/vehicle/{vehicleId}` - Get schedules by vehicle
- `GET /api/ServiceSchedule/upcoming` - Get upcoming schedules
- `GET /api/ServiceSchedule/overdue` - Get overdue schedules

**Dependencies:**
- Fleet.Core (Domain models, Fault/JobCard/ServiceSchedule repositories and services)
- Shared database (Faults, JobCards, JobCardTasks, ServiceSchedules tables)

---

## Shared Components

### Fleet.Core Library
A shared class library containing:
- **Domain Models:** All entity classes (Vehicle, Fleet, Fault, JobCard, etc.)
- **Data Context:** Entity Framework `ApplicationDbContext`
- **Repositories:** Data access layer implementations
- **Services:** Business logic layer
- **Interfaces:** Contracts for repositories and services

### Database
All microservices share a single SQL Server database: `FleetMaintenanceDB`

**Connection String:**
```
Server=ELIAS\SQLDEVELOPER;Database=FleetMaintenanceDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true
```

---

## Authentication & Authorization

### JWT Token Flow

1. **Login:**
   ```
   POST http://localhost:5001/api/Auth/login
   {
     "username": "admin",
     "password": "password"
   }
   ```

2. **Response:**
   ```json
   {
     "token": "eyJhbGciOiJI...",
     "username": "admin",
     "email": "admin@fleet.com",
     "roles": ["SystemAdmin"]
   }
   ```

3. **Use Token:**
   Add to all requests to Fleet.API and Maintenance.API:
   ```
   Authorization: Bearer eyJhbGciOiJI...
   ```

### Authorization Policies

All services use the same JWT configuration and authorization policies:

- **CanView** - All authenticated users
- **CanAdd** - SystemAdmin, TenantAdmin, FleetManager, Staff
- **CanEdit** - SystemAdmin, TenantAdmin, FleetManager, Technician
- **CanDelete** - SystemAdmin, TenantAdmin only
- **RequireManager** - SystemAdmin, TenantAdmin, FleetManager
- **RequireAdmin** - SystemAdmin, TenantAdmin
- **RequireSystemAdmin** - SystemAdmin only

---

## Running the Microservices

### Option 1: Run Individually in Visual Studio

1. **Set Multiple Startup Projects:**
   - Right-click solution → Properties → Multiple startup projects
   - Set Auth.API, Fleet.API, and Maintenance.API to "Start"

2. **Run Solution (F5)**

### Option 2: Run via Command Line

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

### Option 3: Build All Services

```powershell
dotnet build FleetMaintenance.sln
```

---

## API Documentation (Swagger)

Each service has its own Swagger UI:

- **Auth API:** http://localhost:5001/swagger
- **Fleet API:** http://localhost:5002/swagger
- **Maintenance API:** http://localhost:5003/swagger

---

## Migration Path from Monolith

The original `Vehicle.API` project has been split into three focused microservices:

**Before (Monolithic):**
```
Vehicle.API (Port 5000)
├── AuthController
├── FleetController
├── VehicleController
├── FaultController
├── JobCardController
└── ServiceScheduleController
```

**After (Microservices):**
```
Auth.API (Port 5001)
└── AuthController

Fleet.API (Port 5002)
├── FleetController
└── VehicleController

Maintenance.API (Port 5003)
├── FaultController
├── JobCardController
└── ServiceScheduleController
```

**Note:** The original `Vehicle.API` project is still present but can be deprecated or removed once all clients migrate to the new microservices.

---

## Benefits of Microservices Architecture

### 1. **Separation of Concerns**
Each service has a clear, focused responsibility making the codebase easier to understand and maintain.

### 2. **Independent Deployment**
Services can be deployed independently without affecting others. Update auth logic without touching maintenance features.

### 3. **Scalability**
Scale services independently based on demand:
- If maintenance operations are heavy, scale only Maintenance.API
- If you have high login traffic, scale only Auth.API

### 4. **Technology Flexibility**
Each service can use different technologies if needed (though all currently use .NET 8).

### 5. **Team Autonomy**
Different teams can own different services with minimal coordination.

### 6. **Fault Isolation**
If one service fails, others continue to operate. Auth issues won't bring down fleet management.

### 7. **Easier Testing**
Smaller, focused services are easier to test in isolation.

---

## Database Strategy

Currently using a **Shared Database** approach where all microservices access the same database.

### Pros:
- ✅ Simple to implement (no distributed transactions)
- ✅ No data duplication
- ✅ Easier to maintain referential integrity
- ✅ Simpler queries (no need for service-to-service calls)

### Cons:
- ❌ Tight coupling at database level
- ❌ Schema changes may affect multiple services
- ❌ Cannot scale databases independently

### Future: Database per Service
For better isolation, consider migrating to database-per-service:
- **AuthDB:** Users, Roles, Tenants
- **FleetDB:** Fleets, Vehicles, Manufacturers
- **MaintenanceDB:** Faults, JobCards, ServiceSchedules

This would require:
- API-to-API communication for cross-service data
- Event-driven architecture for data synchronization
- Eventual consistency patterns

---

## API Gateway (Future Enhancement)

Consider adding an API Gateway for:
- Single entry point for all clients
- Request routing to appropriate services
- Centralized authentication/authorization
- Rate limiting and throttling
- Load balancing
- Request/response transformation

Recommended tools:
- **Ocelot** (.NET-based API Gateway)
- **YARP** (Yet Another Reverse Proxy - Microsoft)
- **Kong** 
- **Azure API Management**

---

## Service-to-Service Communication (Future)

Currently, services are independent. Future enhancements:

1. **Synchronous (REST/gRPC):**
   - Maintenance.API calls Fleet.API to get vehicle details
   - Direct HTTP calls between services

2. **Asynchronous (Message Queue):**
   - Use RabbitMQ, Azure Service Bus, or Kafka
   - Event-driven architecture
   - Example: When fault is reported, publish event to update vehicle status

---

## Monitoring & Observability (Future)

Add monitoring for production:

1. **Logging:**
   - Serilog with centralized logging (Seq, ELK Stack, Azure Application Insights)
   - Correlation IDs to trace requests across services

2. **Metrics:**
   - Prometheus + Grafana
   - Application Performance Monitoring (APM)

3. **Health Checks:**
   - Add health check endpoints to each service
   - Use `/health` endpoints for monitoring

4. **Distributed Tracing:**
   - OpenTelemetry or Jaeger
   - Track request flow across services

---

## Security Considerations

1. **HTTPS Only in Production**
2. **Rotate JWT Secret Keys regularly**
3. **Implement API rate limiting**
4. **Add request validation and sanitization**
5. **Use secrets management (Azure Key Vault, AWS Secrets Manager)**
6. **Implement CORS policies appropriately**
7. **Add API versioning** (e.g., /api/v1/vehicle)

---

## Development Guidelines

### Adding a New Endpoint

1. **Update the appropriate service** (Auth, Fleet, or Maintenance)
2. **Add to the controller** in that service
3. **Use Fleet.Core** for business logic and data access
4. **Test via Swagger** UI for that service
5. **Update this documentation** if significant

### Adding a New Service

1. Create new .NET Web API project
2. Reference Fleet.Core
3. Configure JWT authentication (copy from existing services)
4. Add to solution file
5. Configure unique port in launchSettings.json
6. Update this documentation

---

## Troubleshooting

### Services won't start
- Check port conflicts (5001, 5002, 5003)
- Verify SQL Server connection string
- Ensure database migrations are applied

### Authentication fails
- Verify JWT settings match across all services
- Check token expiration (default: 60 minutes)
- Ensure user exists in database

### CORS errors
- All services have "AllowAll" CORS policy in development
- Update CORS policy for production

---

## Contact & Support

For questions or issues, refer to the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md).

---

**Last Updated:** April 5, 2026  
**Architecture Version:** 2.0 (Microservices)
