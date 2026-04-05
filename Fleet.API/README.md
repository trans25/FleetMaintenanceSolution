# Fleet.API - Fleet & Vehicle Management Service

Fleet and vehicle management microservice for the Fleet Maintenance System.

## Responsibility
- Fleet management (create, update, delete fleets)
- Vehicle management (create, update, delete vehicles)
- Vehicle lookup by registration, VIN, status

## Port
- HTTP: `http://localhost:5002`
- HTTPS: `https://localhost:7002`

## Controllers
- **FleetController** - `/api/Fleet`
- **VehicleController** - `/api/Vehicle`

## Key Endpoints

### Fleets
- `GET /api/Fleet` - Get all fleets
- `GET /api/Fleet/{id}` - Get fleet by ID
- `GET /api/Fleet/tenant/{tenantId}` - Get fleets by tenant
- `GET /api/Fleet/active` - Get active fleets
- `POST /api/Fleet` - Create fleet
- `PUT /api/Fleet/{id}` - Update fleet
- `DELETE /api/Fleet/{id}` - Delete fleet

### Vehicles
- `GET /api/Vehicle` - Get all vehicles
- `GET /api/Vehicle/{id}` - Get vehicle by ID
- `GET /api/Vehicle/registration/{registrationNumber}` - Find by registration
- `GET /api/Vehicle/vin/{vin}` - Find by VIN
- `GET /api/Vehicle/fleet/{fleetId}` - Get vehicles by fleet
- `GET /api/Vehicle/status/{status}` - Get vehicles by status
- `POST /api/Vehicle` - Create vehicle
- `PUT /api/Vehicle/{id}` - Update vehicle
- `DELETE /api/Vehicle/{id}` - Delete vehicle

## Authentication
All endpoints require JWT token from Auth.API:

```http
Authorization: Bearer {token}
```

## Running

```powershell
cd Fleet.API
dotnet run
```

Swagger UI: http://localhost:5002/swagger

## See Also
- [Microservices Architecture](../MICROSERVICES.md)
- [Main README](../README.md)
